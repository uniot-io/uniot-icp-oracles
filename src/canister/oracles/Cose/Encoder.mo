import Blob "mo:base/Blob";
import Result "mo:base/Result";
import Int64 "mo:base/Int64";
import Nat8 "mo:base/Nat8";
import CborEncoder "mo:cbor/Encoder";
import CborValue "CborValue";
import Errors "Errors";
import Signer "Signer";
import CoseTypes "CoseTypes";
import Utils "Utils";

module Encoder {
  public func encode(message : CoseTypes.Message, signer : Signer.Signer, externalAad : [Nat8]) : async Result.Result<[Nat8], Errors.Error> {
    switch (message) {
      case (#sign1(msg)) await encodeSign1Message(msg, signer, externalAad)
    }
  };

  private func encodeSign1Message(msg : CoseTypes.Sign1Message, signer : Signer.Signer, externalAad : [Nat8]) : async Result.Result<[Nat8], Errors.Error> {
    let alg = Int64.toNat64(Int64.fromInt(CoseTypes.HeaderLabel.Algorithm));
    msg.protectedHeader := #map([(#uint(alg), #int(signer.algorithm))]);
    switch (CborEncoder.encode(CborValue.toBasic(msg.protectedHeader))) {
      case (#ok(encoded)) msg.rawProtectedHeader := encoded;
      case (#err e) return #err(Errors.wrapEncodingError("Failed to encode Protected Header", e))
    };

    switch (msg.unprotectedHeader) {
      case (#map(_)) {
        switch (Utils.Sign1Message.toBeSigned(msg, externalAad)) {
          case (#ok(toSign)) {
            switch (await signer.sign(toSign)) {
              case (#ok(signature)) {
                msg.signature := signature;
                let cose : CborValue.Value = #tagged({
                  tag = 18;
                  value = #array([
                    #bytes(msg.rawProtectedHeader),
                    msg.unprotectedHeader,
                    #bytes(msg.payload),
                    #bytes(msg.signature)
                  ])
                });
                switch (CborEncoder.encode(CborValue.toBasic(cose))) {
                  case (#ok(encoded)) return #ok(encoded);
                  case (#err e) return #err(Errors.wrapEncodingError("Failed to encode COSE", e))
                }
              };
              case (#err e) return #err(Errors.wrap("Failed to sign message", e))
            }
          };
          case (#err e) #err(Errors.wrapEncodingError("Failed to get bytes to be signed", e))
        }
      };
      case _ #err(#msg "Unprotected Header must be a map")
    }
  }
}
