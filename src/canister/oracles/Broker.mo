import I "mo:base/Iter";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Bool "mo:base/Bool";
import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import HttpTypes "HttpTypes";
import CharUtils "CharUtils";
import CoseDecoder "Cose/Decoder";
import CoseVerifier "Cose/Verifier";
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
        cyclesUsed := maxCycles - cyclesRefunded
      };

      (response, cyclesUsed)
    }
  };

  public class UrlBuilder(_host : Text) {
    let host = _host;

    public func retainedMessage(topic : Text, sign : Bool) : Text {
      "https://" # host # "/api/v1/messages/retained?topic=" # topic # "&sign=" # Bool.toText(sign)
    }
  };

  public class Broker(_host : Text, _publicKey : Text, _transform : shared query HttpTypes.TransformArgs -> async HttpTypes.HttpResponsePayload) {
    let urlBuilder : UrlBuilder = UrlBuilder(_host);
    let publicKey : [Nat8] = Hex.unsafeDecode(_publicKey);
    let client : HttpClient = HttpClient(_transform);
    let expectedResponseBytes : Nat64 = 2 * 1024;
    let maxCycles = 200_000_000_000;

    public func handleRetainedMessages(topics : I.Iter<Text>, sign : Bool, handler : (topic : Text, msg : Blob, signed : Bool, verified : Bool) -> ()) : async (Nat, Nat) {
      var successfullUpdates : Nat = 0;
      var totalCyclesUsed : Nat = 0;

      for (topic in topics) {
        let url = urlBuilder.retainedMessage(topic, sign);
        let headers = [{ name = "Accept"; value = "application/octet-stream" }];
        let (response, cyclesUsed) = await client.get(url, headers, expectedResponseBytes, maxCycles);

        totalCyclesUsed += cyclesUsed;
        if (response.status == 200) {
          let message = Blob.fromArray(response.body);
          if (sign) {
            let (verified, verifiedMessage) = Message.getVerifiedMessage(message, publicKey);
            handler(topic, verifiedMessage, true, verified)
          } else {
            handler(topic, message, false, false)
          };
          successfullUpdates += 1
        }
      };

      return (successfullUpdates, totalCyclesUsed)
    }
  };

  public module Message {
    public func getVerifiedMessage(message : Blob, publicKey : [Nat8]) : (Bool, Blob) {
      switch (CoseDecoder.decode(message)) {
        case (#ok(msg)) {
          switch (msg) {
            case (#sign1(coseSign1Msg)) {
              switch (CoseVerifier.verifySign1Message(coseSign1Msg, [], publicKey)) {
                case (#ok(verified))(verified, Blob.fromArray(coseSign1Msg.payload));
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
    }
  }
}
