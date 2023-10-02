import Blob "mo:base/Blob";
import Principal "mo:base/Principal";
import RBTree "mo:base/RBTree";
import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Hash "mo:base/Hash";
import TrieSetUtil "TrieSetUtil";

actor {
  type SubscriptionDto = {
    topic : Text;
    message : Blob;
    refCount : Nat
  };

  type OracleDto = {
    id : Nat;
    owner : Principal;
    subscriptions : [(Text, Text)]
  };

  type UserDto = {
    principal : Principal;
    oraclesCount : Nat;
    oracles : [Nat]
  };

  class Subscription(_topic : Text) {
    public let topic = _topic;
    public var message = Blob.fromArray([]);
    public var refCount : Nat = 0;

    public func getDto() : SubscriptionDto { { topic; message; refCount } }
  };

  class Oracle(_id : Nat, _owner : Principal) {
    public let id = _id;
    public let owner = _owner;
    public let subscriptions = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);

    public func getDto() : OracleDto {
      let subscriptionsArray = Array.init<(Text, Text)>(subscriptions.size(), ("", ""));
      var i = 0;
      for ((key, value) in subscriptions.entries()) {
        subscriptionsArray[i] := (key, value);
        i += 1
      };
      { id = id; owner = owner; subscriptions = Array.freeze<(Text, Text)>(subscriptionsArray) }
    };

    public func subscribe(subscription : Subscription, messageType : Text) {
      subscriptions.put(subscription.topic, messageType);
      subscription.refCount += 1
    }
  };

  class User(_principal : Principal) {
    public let principal = _principal;
    public var oracles = TrieSetUtil.Set<Nat>(Nat.equal, Hash.hash);
    public var oraclesCount = 0;

    public func getDto() : UserDto {
      let oraclesArray = oracles.toArray();
      { principal; oraclesCount; oracles = oraclesArray }
    };

    public func putOracle(oracle : Oracle) {
      oracles.put(oracle.id);
      oraclesCount += 1
    }
  };

  // system func preupgrade() {
  // };

  // system func postupgrade() {
  // };

  var subscriptions : TrieMap.TrieMap<Text, Subscription> = TrieMap.TrieMap<Text, Subscription>(Text.equal, Text.hash);
  var oracles : RBTree.RBTree<Nat, Oracle> = RBTree.RBTree<Nat, Oracle>(Nat.compare);
  var users : TrieMap.TrieMap<Principal, User> = TrieMap.TrieMap<Principal, User>(Principal.equal, Principal.hash);
  /*stable*/ var oraclesCounter : Nat = 0;

  public shared (msg) func createOracle() : async Nat {
    // assert not Principal.isAnonymous(msg.caller);

    let user = switch (users.get(msg.caller)) {
      case (null) {
        let newUser = User(msg.caller);
        users.put(msg.caller, newUser);
        newUser
      };
      case (?existingUser) existingUser
    };

    let newOracle = Oracle(oraclesCounter, msg.caller);
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
          let newSubscription = Subscription(newSub.topic);
          subscriptions.put(newSub.topic, newSubscription);
          newSubscription
        };
        case (?existingSubscription) existingSubscription
      };

      existingOracle.subscribe(subscription, newSub.msgType)
    }
  };

  public shared (msg) func publish(topic : Text, message : Blob) {
    switch (subscriptions.get(topic)) {
      case (null) {
        assert false
      };
      case (?existingSubscription) {
        existingSubscription.message := message;
        ignore subscriptions.replace(topic, existingSubscription)
      }
    }
  };

  public query func getSubscription(topic : Text) : async ?SubscriptionDto {
    switch (subscriptions.get(topic)) {
      case null null;
      case (?subscription) ?subscription.getDto()
    }
  };

  public query func getOracle(oracleId : Nat) : async ?OracleDto {
    switch (oracles.get(oracleId)) {
      case null null;
      case (?oracle) ?oracle.getDto()
    }
  };

  public query func getUser(principal : Principal) : async ?UserDto {
    return switch (users.get(principal)) {
      case null null;
      case (?user) ?user.getDto()
    }
  };

}
