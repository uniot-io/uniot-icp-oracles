import I "mo:base/Iter";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import HttpTypes "HttpTypes";
import CharUtils "CharUtils";

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

    public func retainedMessage(topic : Text) : Text {
      "https://" #host # "/api/v1/messages/retained?topic=" # topic
    }
  };

  public class Broker(_host : Text, _transform : shared query HttpTypes.TransformArgs -> async HttpTypes.HttpResponsePayload) {
    let urlBuilder : UrlBuilder = UrlBuilder(_host);
    let client : HttpClient = HttpClient(_transform);
    let expectedResponseBytes : Nat64 = 2 * 1024;
    let maxCycles = 200_000_000_000;

    public func handleRetainedMessages(topics : I.Iter<Text>, handler : (topic : Text, msg : Blob) -> ()) : async (Nat, Nat) {
      var successfullUpdates : Nat = 0;
      var totalCyclesUsed : Nat = 0;

      for (topic in topics) {
        let url = urlBuilder.retainedMessage(topic);
        let headers = [{ name = "Accept"; value = "application/octet-stream" }];
        let (response, cyclesUsed) = await client.get(url, headers, expectedResponseBytes, maxCycles);

        totalCyclesUsed += cyclesUsed;
        if (response.status == 200) {
          handler(topic, Blob.fromArray(response.body));
          successfullUpdates += 1
        }
      };

      return (successfullUpdates, totalCyclesUsed)
    }
  }
}
