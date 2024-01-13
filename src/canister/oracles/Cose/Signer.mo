import Blob "mo:base/Blob";
import Error "mo:base/Error";
import Result "mo:base/Result";
import Cycles "mo:base/ExperimentalCycles";
import Utils "Utils";
import Errors "Errors";
import CoseTypes "CoseTypes";

module Signer {
  public type Key = {
    #development;
    #staging;
    #production
  };

  public type Signer = {
    algorithm : Int;
    sign : (message : [Nat8]) -> async Result.Result<[Nat8], Errors.Error>
  };

  public class SECP256K1(_derivation : Blob, _key : Key) : Signer {
    private type IC = actor {
      ecdsa_public_key : ({
        canister_id : ?Principal;
        derivation_path : [Blob];
        key_id : { curve : { #secp256k1 }; name : Text }
      }) -> async ({ public_key : Blob; chain_code : Blob });
      sign_with_ecdsa : ({
        message_hash : Blob;
        derivation_path : [Blob];
        key_id : { curve : { #secp256k1 }; name : Text }
      }) -> async ({ signature : Blob })
    };

    private let ic : IC = actor ("aaaaa-aa");
    private let derivation = _derivation;
    private let key = switch (_key) {
      case (#development) "dfx_test_key";
      case (#staging) "test_key_1";
      case (#production) "key_1"
    };

    public let algorithm = CoseTypes.Algorithm.ES256K;

    public func publicKey() : async Result.Result<[Nat8], Errors.Error> {
      try {
        let { public_key } = await ic.ecdsa_public_key({
          canister_id = null;
          derivation_path = [derivation];
          key_id = { curve = #secp256k1; name = key }
        });
        #ok(Blob.toArray(public_key))
      } catch (err) {
        #err(#msg(Error.message(err)))
      }
    };

    public func sign(message : [Nat8]) : async Result.Result<[Nat8], Errors.Error> {
      try {
        let message_hash = Blob.fromArray(Utils.Crypto.sha256(message));
        Cycles.add(25_000_000_000);
        let { signature } = await ic.sign_with_ecdsa({
          message_hash;
          derivation_path = [derivation];
          key_id = { curve = #secp256k1; name = key }
        });
        #ok(Blob.toArray(signature))
      } catch (err) {
        #err(#msg(Error.message(err)))
      }
    }
  }
}
