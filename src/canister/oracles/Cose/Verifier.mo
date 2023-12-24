import Result "mo:base/Result";
import Lib "mo:ed25519";
import CborValue "CborValue";
import CoseTypes "CoseTypes";
import Errors "Errors";
import Utils "Utils";

module Verifier {
  public func verify(message : CoseTypes.Message, externalAad : [Nat8], publicKey : [Nat8]) : Result.Result<Bool, Errors.Error> {
    switch (message) {
      case (#sign1(msg)) verifySign1Message(msg, externalAad, publicKey)
    }
  };

  private func verifySign1Message(message : CoseTypes.Sign1Message, externalAad : [Nat8], publicKey : [Nat8]) : Result.Result<Bool, Errors.Error> {
    switch (Utils.Map.getInt(message.protectedHeader, CoseTypes.HeaderLabel.Algorithm)) {
      case (#ok(alg)) {
        if (alg == CoseTypes.Algorithm.EdDSA or alg == CoseTypes.Algorithm.ES256K) {
          switch (Utils.Sign1Message.toBeSigned(message, externalAad)) {
            case (#ok(toVerify)) #ok(verifyRaw(alg, message.signature, toVerify, publicKey));
            case (#err e) #err(Errors.wrapEncodingError("Failed to get bytes to be verified", e))
          }
        } else #err(#msg "Unsupported algorithm")
      };
      case (#err e) #err(Errors.wrap("Failed to get algorithm", e))
    }
  };

  private func verifyRaw(algorithm : Int, signature : [Nat8], message : [Nat8], publicKey : [Nat8]) : Bool {
    if (algorithm == CoseTypes.Algorithm.EdDSA) {
      Lib.ED25519.verify(signature, message, publicKey)
    } else if (algorithm == CoseTypes.Algorithm.ES256K) {
      Utils.Crypto.SECP256K1.verify(signature, message, publicKey)
    } else false
  }
}
