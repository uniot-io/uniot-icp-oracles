import Int64 "mo:base/Int64";
import Array "mo:base/Array";
import Result "mo:base/Result";
import CborEncoder "mo:cbor/Encoder";
import CborErrors "mo:cbor/Errors";
import CborValue "CborValue";
import CoseTypes "CoseTypes";
import Errors "Errors";

module Utils {
  public module Sign1Message {
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
