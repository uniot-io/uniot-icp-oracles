import Blob "mo:base/Blob";
import Iter "mo:base/Iter";
import Int64 "mo:base/Int64";
import Array "mo:base/Array";
import Result "mo:base/Result";
import CborEncoder "mo:cbor/Encoder";
import CborErrors "mo:cbor/Errors";
import CryptoUtils "mo:ecdsa/util";
import ECDSA "mo:ecdsa";
import CborValue "CborValue";
import CoseTypes "CoseTypes";
import Errors "Errors";

module Utils {
  public module Crypto {
    public func sha256(message : [Nat8]) : [Nat8] {
      Blob.toArray(ECDSA.sha2(Iter.fromArray(message)))
    };

    public module SECP256K1 {
      public func verify(signature : [Nat8], message : [Nat8], publicKey : [Nat8]) : Bool {
        if (Array.size(signature) != 64 and Array.size(publicKey) != 33) {
          return false
        };

        let pubKeyBlob = Blob.fromArray(publicKey);
        let pubKey = ECDSA.deserializePublicKeyCompressed(pubKeyBlob);

        let rPart = Array.subArray<Nat8>(signature, 0, 32);
        let sPart = Array.subArray<Nat8>(signature, 32, 32);
        let rIter = Iter.fromArray(rPart);
        let sIter = Iter.fromArray(sPart);
        let r = CryptoUtils.toNatAsBigEndian(rIter);
        let s = CryptoUtils.toNatAsBigEndian(sIter);
        let sig = (#fr(r), #fr(s));

        let msgIter = Iter.fromArray(message);

        switch (pubKey) {
          case (?pk) ECDSA.verify(pk, msgIter, sig);
          case null false
        }
      }
    }
  };

  public module Sign1Message {
    public func new(payload : [Nat8], unprotectedHeader : CborValue.Value) : CoseTypes.Sign1Message {
      {
        var rawProtectedHeader = [];
        var protectedHeader = #simple(#nil);
        var unprotectedHeader;
        var payload;
        var signature = []
      }
    };

    public func toBeSigned(message : CoseTypes.Sign1Message, externalAad : [Nat8]) : Result.Result<[Nat8], CborErrors.EncodingError> {
      let toSign : CborValue.Value = #array([
        #text("Signature1"),
        #bytes(message.rawProtectedHeader),
        #bytes(externalAad),
        #bytes(message.payload)
      ]);
      CborEncoder.encode(CborValue.toBasic(toSign))
    }
  };

  public module Number {
    public func get(value : CborValue.Value) : Result.Result<Int, Errors.Error> {
      switch (value) {
        case (#uint(numValue)) #ok(Int64.toInt(Int64.fromNat64(numValue)));
        case (#int(numValue)) #ok numValue;
        case _ #err(#msg "Expected number")
      }
    }
  };

  public module Map {
    public func getInt(map : CborValue.Value, key : Int) : Result.Result<Int, Errors.Error> {
      switch (map) {
        case (#map(entries)) {
          let found = Array.find<(CborValue.Value, CborValue.Value)>(
            entries,
            func(keyValue, _) {
              switch (Utils.Number.get(keyValue)) {
                case (#ok(foundKey)) foundKey == key;
                case _ false
              }
            }
          );
          switch (found) {
            case (?(_, foundValue)) {
              switch (Utils.Number.get(foundValue)) {
                case (#ok(alg)) #ok alg;
                case _ #err(#msg "Expected value to be a number")
              }
            };
            case _ #err(#msg "Key not found")
          }
        };
        case _ #err(#msg "Expected map")
      }
    }
  }
}
