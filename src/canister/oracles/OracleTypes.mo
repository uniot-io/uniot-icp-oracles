import I "mo:base/Iter";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Hash "mo:base/Hash";
import Array "mo:base/Array";
import TrieMap "mo:base/TrieMap";
import TrieSetUtils "TrieSetUtils";

module OracleTypes {

  public type SubscriptionDto = {
    topic : Text;
    message : Blob;
    signed : Bool;
    verified : Bool;
    timestamp : Int;
    refCount : Nat
  };

  public type OracleDto = {
    id : Nat;
    owner : Principal;
    name : Text;
    template : Text;
    subscriptions : [(Text, Text)]
  };

  public type UserDto = {
    principal : Principal;
    oracles : [Nat]
  };

  public class Subscription(_topic : Text) {
    public let topic = _topic;
    public var message = Blob.fromArray([]);
    public var timestamp : Int = 0;
    public var refCount : Nat = 0;
    public var signed : Bool = false;
    public var verified : Bool = false;

    public func getDto() : SubscriptionDto { { topic; message; signed; verified; timestamp; refCount } }
  };

  public class Oracle(_id : Nat, _owner : Principal, _name : Text, _template : Text) {
    public let id = _id;
    public let owner = _owner;
    public let name = _name;
    public let template = _template;
    public let subscriptions = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);

    public func getDto() : OracleDto {
      let subscriptionsArray = Array.init<(Text, Text)>(subscriptions.size(), ("", ""));
      var i = 0;
      for ((key, value) in subscriptions.entries()) {
        subscriptionsArray[i] := (key, value);
        i += 1
      };
      { id; owner; name; template; subscriptions = Array.freeze<(Text, Text)>(subscriptionsArray) }
    };

    public func getSubscriptionsIter() : I.Iter<Text> {
      subscriptions.keys()
    };

    public func subscribe(subscription : Subscription, messageType : Text) {
      subscriptions.put(subscription.topic, messageType);
      subscription.refCount += 1
    }
  };

  public class User(_principal : Principal) {
    public let principal = _principal;
    public var oracles = TrieSetUtils.Set<Nat>(Nat.equal, Hash.hash);

    public func getDto() : UserDto {
      let oraclesArray = oracles.toArray();
      { principal; oracles = oraclesArray }
    };

    public func putOracle(oracle : Oracle) {
      oracles.put(oracle.id)
    }
  }
}
