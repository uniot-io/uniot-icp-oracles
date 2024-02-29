import I "mo:base/Iter";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Bool "mo:base/Bool";
import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Random "mo:base/Random";
import HttpTypes "HttpTypes";
import CharUtils "CharUtils";
import CoseEncoder "Cose/Encoder";
import CoseDecoder "Cose/Decoder";
import CoseVerifier "Cose/Verifier";
import Signer "Cose/Signer";
import CoseUtils "Cose/Utils";
import Errors "Cose/Errors";
import CborValue "Cose/CborValue";
import CborEncoder "mo:cbor/Encoder";
import Hex "Hex";

module Broker {
  public func transformResponse(raw : HttpTypes.TransformArgs) : HttpTypes.HttpResponsePayload {
    let requiredHeaders = ["content-length", "content-type"];
    let filteredHeaders = Array.filter<(header : HttpTypes.HttpHeader)>(
      raw.response.headers,
      func((header) : (HttpTypes.HttpHeader)) : Bool {
        let headerName = Text.map(header.name, CharUtils.toLowercase);
        for (required in requiredHeaders.vals()) {
          if (required == headerName) {
            return true
          }
        };
        false
      }
    );

    let transformed : HttpTypes.HttpResponsePayload = {
      status = raw.response.status;
      body = raw.response.body;
      headers = filteredHeaders
    };
    transformed
  };

  public class HttpClient(_transform : shared query HttpTypes.TransformArgs -> async HttpTypes.HttpResponsePayload) {
    let transform = _transform;
    let ic : HttpTypes.IC = actor ("aaaaa-aa");

    public func get(url : Text, headers : [HttpTypes.HttpHeader], expectedResponseBytes : Nat64, maxCycles : Nat) : async (response : HttpTypes.HttpResponsePayload, cyclesUsed : Nat) {
      let transform_context : HttpTypes.TransformContext = {
        function = transform;
        context = Blob.fromArray([])
      };

      let http_request : HttpTypes.HttpRequestArgs = {
        url = url;
        method = #get;
        headers;
        body = null;
        max_response_bytes = ?expectedResponseBytes;
        transform = ?transform_context
      };

      let cyclesToPay = Nat.min(maxCycles, Cycles.balance());
      Cycles.add(cyclesToPay);
      let response = await ic.http_request(http_request);
      let cyclesRefunded = Cycles.refunded();
      var cyclesUsed = cyclesToPay;
      if (cyclesRefunded < cyclesToPay) {
        cyclesUsed := cyclesToPay - cyclesRefunded
      };

      (response, cyclesUsed)
    };

    public func post(url : Text, headers : [HttpTypes.HttpHeader], body : [Nat8], expectedResponseBytes : Nat64, maxCycles : Nat) : async (response : HttpTypes.HttpResponsePayload, cyclesUsed : Nat) {
      let transform_context : HttpTypes.TransformContext = {
        function = transform;
        context = Blob.fromArray([])
      };

      let http_request : HttpTypes.HttpRequestArgs = {
        url = url;
        method = #post;
        headers;
        body = ?body;
        max_response_bytes = ?expectedResponseBytes;
        transform = ?transform_context
      };

      let cyclesToPay = Nat.min(maxCycles, Cycles.balance());
      Cycles.add(cyclesToPay);
      let response = await ic.http_request(http_request);
      let cyclesRefunded = Cycles.refunded();
      var cyclesUsed = cyclesToPay;
      if (cyclesRefunded < cyclesToPay) {
        cyclesUsed := cyclesToPay - cyclesRefunded
      };

      (response, cyclesUsed)
    };

    public func generateIdempotencyKey() : async Text {
      let random = Random.Finite(await Random.blob());
      let timestampComponent = Int.toText(Time.now());
      let randomComponent = switch (random.range(64)) {
        case (?value) Nat.toText(value);
        case (_) "0"
      };
      return timestampComponent # "-" # randomComponent
    }
  };

  public class UrlBuilder(_host : Text) {
    let host = _host;

    public func getRetainedMessage(topic : Text, sign : Bool) : Text {
      "https://" # host # "/api/v1/messages/retained?topic=" # topic # "&sign=" # Bool.toText(sign)
    };

    public func publishRetainedMessage() : Text {
      "https://" # host # "/api/v1/messages/retained/publish"
    }
  };

  public class Broker(_host : Text, _remotePublicKey : Text, _transform : shared query HttpTypes.TransformArgs -> async HttpTypes.HttpResponsePayload) {
    let urlBuilder : UrlBuilder = UrlBuilder(_host);
    let remotePublicKey : [Nat8] = Hex.unsafeDecode(_remotePublicKey);
    let signer = Signer.SECP256K1(Text.encodeUtf8("UNIOT"), #development);
    let client : HttpClient = HttpClient(_transform);
    let expectedResponseBytes : Nat64 = 2 * 1024;
    let maxCycles = 200_000_000_000;

    public func getRemotePublicKey() : [Nat8] {
      remotePublicKey
    };

    public func getSignerPublicKey() : async Result.Result<[Nat8], Errors.Error> {
      await signer.publicKey()
    };

    public func handleRetainedMessages(topics : I.Iter<Text>, sign : Bool, handler : (topic : Text, msg : Blob, signed : Bool, verified : Bool) -> ()) : async (Nat, Nat) {
      var successfullUpdates : Nat = 0;
      var totalCyclesUsed : Nat = 0;

      for (topic in topics) {
        let url = urlBuilder.getRetainedMessage(topic, sign);
        let headers = [{ name = "Accept"; value = "application/octet-stream" }];
        let (response, cyclesUsed) = await client.get(url, headers, expectedResponseBytes, maxCycles);

        totalCyclesUsed += cyclesUsed;
        if (response.status == 200) {
          let message = Blob.fromArray(response.body);
          if (sign) {
            let (verified, verifiedMessage) = Message.getVerifiedMessage(message, remotePublicKey);
            handler(topic, verifiedMessage, true, verified)
          } else {
            handler(topic, message, false, false)
          };
          successfullUpdates += 1
        }
      };

      return (successfullUpdates, totalCyclesUsed)
    };

    public func publishRetainedMessage(topic : Text, payload : Blob) : async (Bool, Nat) {
      let url = urlBuilder.publishRetainedMessage();
      let headers = [
        { name = "Content-Type"; value = "application/octet-stream" },
        { name = "Idempotency-Key"; value = await client.generateIdempotencyKey() }
      ];

      switch (await Message.packSignedMessage(topic, payload, signer)) {
        case (#ok(body)) {
          let (response, cyclesUsed) = await client.post(url, headers, body, expectedResponseBytes, maxCycles);
          return (response.status == 200, cyclesUsed)
        };
        case (#err e) {
          Debug.print(debug_show (e))
        }
      };
      return (false, 0)
    }
  };

  public module Message {
    public func getVerifiedMessage(message : Blob, publicKey : [Nat8]) : (Bool, Blob) {
      switch (CoseDecoder.decode(message)) {
        case (#ok(msg)) {
          switch (msg) {
            case (#sign1(coseSign1Msg)) {
              switch (CoseVerifier.verifySign1Message(coseSign1Msg, [], publicKey)) {
                case (#ok(verified)) (verified, Blob.fromArray(coseSign1Msg.payload));
                case (#err e) {
                  Debug.print(debug_show (e));
                  (false, Blob.fromArray(coseSign1Msg.payload))
                }
              }
            }
          }
        };
        case (#err e) {
          Debug.print(debug_show (e));
          (false, message)
        }
      }
    };

    public func packSignedMessage(topic : Text, payload : Blob, signer : Signer.Signer) : async Result.Result<[Nat8], Errors.Error> {
      let rawMessage = #map([
        (#text("topic"), #text(topic)),
        (#text("payload"), #bytes(Blob.toArray(payload)))
      ]);
      switch (CborEncoder.encode(CborValue.toBasic(rawMessage))) {
        case (#ok(encoded)) {
          let message = CoseUtils.Sign1Message.new(encoded, #map([]));
          switch (await CoseEncoder.encode(#sign1(message), signer, [])) {
            case (#ok(bytes)) #ok(bytes);
            case (#err e) #err(Errors.wrap("Failed to sign message", e))
          }
        };
        case (#err e) #err(Errors.wrapEncodingError("Failed to encode message", e))
      }
    }
  }
}
