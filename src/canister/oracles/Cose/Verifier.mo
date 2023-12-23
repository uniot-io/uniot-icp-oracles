import Result "mo:base/Result";
import Lib "mo:ed25519";
import CborValue "CborValue";
import CoseTypes "CoseTypes";
import Errors "Errors";
import Utils "Utils";

module Verifier {
  public func verify(message : CoseTypes.Message, externalAad : [Nat8], publicKey : [Nat8]) : Result.Result<Bool, Errors.Error> {
    switch (message) {
      case (#sign1(msg)) {
        switch (Utils.Map.getInt(msg.protectedHeader, CoseTypes.HeaderLabel.Algorithm)) {
          case (#ok(alg)) verifySign1Message(alg, msg, externalAad, publicKey);
          case (#err e) #err(Errors.extend("Failed to get algorithm", e))
        }
      }
    }
  };

  private func verifySign1Message(algorithm : Int, message : CoseTypes.Sign1Message, externalAad : [Nat8], publicKey : [Nat8]) : Result.Result<Bool, Errors.Error> {
    if (algorithm == CoseTypes.Algorithm.EdDSA) {
      switch (Utils.Sign1Message.toBeSigned(message, externalAad)) {
        case (#ok(toVerify)) #ok(Lib.ED25519.verify(message.signature, toVerify, publicKey));
        case (#err e) #err(Errors.extendEncodingError("Failed to get bytes to be verified", e))
      }
    } else #err(#msg "Unsupported algorithm")
  }
}
