import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Result "mo:base/Result";
import CborDecoder "mo:cbor/Decoder";
import CborValue "CborValue";
import CoseTypes "CoseTypes";
import Errors "Errors";

import Debug "mo:base/Debug";

module Decoder {
  public func decode(blob : Blob) : Result.Result<CoseTypes.Message, Errors.Error> {
    switch (CborDecoder.decode(blob)) {
      case (#ok(cbor)) {
        switch (CborValue.toReadable(cbor)) {
          case (#tagged({ tag = 18; value = #array(body) })) {
            switch (decodeSign1Message(body)) {
              case (#ok msg) #ok(#sign1(msg));
              case (#err e) #err e
            }
          };
          case (#tagged({ tag = 98; value = _ })) #err(#msg "Unsupported COSE_Sign packet");
          case (#tagged({ tag = 16; value = _ })) #err(#msg "Unsupported COSE_Encrypt0 packet");
          case (#tagged({ tag = 96; value = _ })) #err(#msg "Unsupported COSE_Encrypt packet");
          case (#tagged({ tag = 17; value = _ })) #err(#msg "Unsupported COSE_Mac0 packet");
          case (#tagged({ tag = 97; value = _ })) #err(#msg "Unsupported COSE_Mac packet");
          case _ #err(#msg "Unrecognized format")
        }
      };
      case (#err e) #err(Errors.extendDecodingError("Error decoding CBOR", e))
    }
  };

  private func decodeSign1Message(body : [CborValue.Value]) : Result.Result<CoseTypes.Sign1Message, Errors.Error> {
    var rawProtectedHeader : [Nat8] = [];
    var protectedHeader : CborValue.Value = #simple(#nil);
    var unprotectedHeader : CborValue.Value = #simple(#nil);
    var payload : [Nat8] = [];
    var signature : [Nat8] = [];

    switch (Array.size(body)) {
      case (4) {
        switch (body[0]) {
          case (#bytes(ph)) {
            rawProtectedHeader := ph;
            switch (CborDecoder.decode(Blob.fromArray(rawProtectedHeader))) {
              case (#ok(dph)) {
                protectedHeader := CborValue.toReadable(dph);
                switch (body[1]) {
                  case (#map(uph)) {
                    unprotectedHeader := #map(uph);
                    switch (body[2]) {
                      case (#bytes(p)) {
                        payload := p;
                        switch (body[3]) {
                          case (#bytes(s)) {
                            signature := s;
                            #ok({ rawProtectedHeader; protectedHeader; unprotectedHeader; payload; signature })
                          };
                          case _ #err(#msg "Malformed Signature")
                        }
                      };
                      case _ #err(#msg "Malformed Payload")
                    }
                  };
                  case _ #err(#msg "Malformed Unprotected Header")
                }
              };
              case (#err e) #err(Errors.extendDecodingError("Error decoding Protected Header", e))
            }
          };
          case _ #err(#msg "Malformed Protected Header")
        }
      };
      case _ #err(#msg "Malformed COSE_Sign1 packet")
    }
  }
}
