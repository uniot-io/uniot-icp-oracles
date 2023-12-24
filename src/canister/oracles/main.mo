import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Time "mo:base/Time";
import RBTree "mo:base/RBTree";
import TrieMap "mo:base/TrieMap";
import Principal "mo:base/Principal";
import Broker "Broker";
import HttpTypes "HttpTypes";
import OracleTypes "OracleTypes";

import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import CoseDecoder "Cose/Decoder";
import CoseErrors "Cose/Errors";
import CoseVerifier "Cose/Verifier";
import CoseUtils "Cose/Utils";
import Encoder "Cose/Encoder";
import Signer "Cose/Signer";
import Hex "Hex";

actor {

  // system func preupgrade() {
  // };

  // system func postupgrade() {
  // };

  public query func transformBrokerResponse(raw : HttpTypes.TransformArgs) : async HttpTypes.HttpResponsePayload {
    Broker.transformResponse(raw)
  };

  let broker = Broker.Broker("mqtt.uniot.io", transformBrokerResponse);
  var subscriptions : TrieMap.TrieMap<Text, OracleTypes.Subscription> = TrieMap.TrieMap<Text, OracleTypes.Subscription>(Text.equal, Text.hash);
  var oracles : RBTree.RBTree<Nat, OracleTypes.Oracle> = RBTree.RBTree<Nat, OracleTypes.Oracle>(Nat.compare);
  var users : TrieMap.TrieMap<Principal, OracleTypes.User> = TrieMap.TrieMap<Principal, OracleTypes.User>(Principal.equal, Principal.hash);
  /*stable*/ var oraclesCounter : Nat = 0;

  public shared (msg) func createOracle(name : Text, template : Text) : async Nat {
    // assert not Principal.isAnonymous(msg.caller);
    assert name != "";
    assert template != "";

    let user = switch (users.get(msg.caller)) {
      case (null) {
        let newUser = OracleTypes.User(msg.caller);
        users.put(msg.caller, newUser);
        newUser
      };
      case (?existingUser) existingUser
    };

    let newOracle = OracleTypes.Oracle(oraclesCounter, msg.caller, name, template);
    user.putOracle(newOracle);
    oracles.put(newOracle.id, newOracle);
    oraclesCounter += 1;

    return newOracle.id
  };

  public shared (msg) func subscribe(oracleId : Nat, subs : [{ topic : Text; msgType : Text }]) {
    let existingOracle = switch (oracles.get(oracleId)) {
      case (null) return assert false;
      case (?oracle) oracle
    };

    assert existingOracle.owner == msg.caller;
    assert subs.size() > 0;

    for (newSub in subs.vals()) {
      assert newSub.topic != "";
      assert newSub.msgType != "";
      assert switch (existingOracle.subscriptions.get(newSub.topic)) {
        case null true;
        case _ false
      };

      let subscription = switch (subscriptions.get(newSub.topic)) {
        case (null) {
          let newSubscription = OracleTypes.Subscription(newSub.topic);
          subscriptions.put(newSub.topic, newSubscription);
          newSubscription
        };
        case (?existingSubscription) existingSubscription
      };

      existingOracle.subscribe(subscription, newSub.msgType)
    }
  };

  private func publish(topic : Text, message : Blob) {
    switch (subscriptions.get(topic)) {
      case (null) {
        assert false
      };
      case (?existingSubscription) {
        existingSubscription.message := message;
        existingSubscription.timestamp := Time.now();
        ignore subscriptions.replace(topic, existingSubscription)
      }
    }
  };

  public shared (msg) func syncOracle(oracleId : Nat) : async (Nat, Nat) {
    let existingOracle = switch (oracles.get(oracleId)) {
      case (null) { assert false; return (0, 0) };
      case (?oracle) oracle
    };

    assert existingOracle.owner == msg.caller;

    await broker.handleRetainedMessages(existingOracle.getSubscriptionsIter(), publish)
  };

  public query func getSubscription(topic : Text) : async ?OracleTypes.SubscriptionDto {
    switch (subscriptions.get(topic)) {
      case null null;
      case (?subscription) ?subscription.getDto()
    }
  };

  public query func getOracle(oracleId : Nat) : async ?OracleTypes.OracleDto {
    switch (oracles.get(oracleId)) {
      case null null;
      case (?oracle) ?oracle.getDto()
    }
  };

  public query func getUser(principal : Principal) : async ?OracleTypes.UserDto {
    return switch (users.get(principal)) {
      case null null;
      case (?user) ?user.getDto()
    }
  };

  public query (msg) func getMyUser() : async OracleTypes.UserDto {
    return switch (users.get(msg.caller)) {
      case null { { principal = msg.caller; oracles = [] } };
      case (?user) user.getDto()
    }
  };

  public shared (msg) func verifyCose(hexCose : Text, hexPubKey : Text) : async Result.Result<Bool, CoseErrors.Error> {
    switch (Hex.decode(hexCose)) {
      case (#ok(bytesCose)) {
        Debug.print(debug_show (bytesCose));
        switch (CoseDecoder.decode(Blob.fromArray(bytesCose))) {
          case (#ok(msg)) {
            switch (Hex.decode(hexPubKey)) {
              case (#ok(bytesPubKey)) {
                Debug.print(debug_show (bytesPubKey));
                CoseVerifier.verify(msg, [], bytesPubKey)
              };
              case (#err e) #err(CoseErrors.wrap("Failed to decode hexPubKey", e))
            }
          };
          case (#err e) #err(CoseErrors.wrap("Failed to decode cose message", e))
        }
      };
      case (#err e) #err(CoseErrors.wrap("Failed to decode hexCose", e))
    }
  };

  let init = Text.encodeUtf8("UNIOT");
  let signer = Signer.SECP256K1(init, #development);

  public shared (msg) func public_key() : async Result.Result<Text, CoseErrors.Error> {
    switch (await signer.publicKey()) {
      case (#ok key) #ok(Hex.encode(key));
      case (#err e) #err e
    }
  };

  public shared (msg) func sign(message : Text) : async Result.Result<Text, CoseErrors.Error> {
    switch (Hex.decode(message)) {
      case (#ok bytes) {
        switch (await signer.sign(bytes)) {
          case (#ok signature) #ok(Hex.encode(signature));
          case (#err e) #err e
        }
      };
      case (#err e) #err e
    }
  };

  public shared (msg) func signCose(payload : Text) : async Result.Result<Text, CoseErrors.Error> {
    let payloadBytes = Blob.toArray(Text.encodeUtf8(payload));
    let message = CoseUtils.Sign1Message.new(payloadBytes, #map([]));
    switch (await Encoder.encode(#sign1(message), signer, [])) {
      case (#ok(bytes)) {
        Debug.print(debug_show (message));
        #ok(Hex.encode(bytes))
      };
      case (#err e) #err e
    }
  }
}
