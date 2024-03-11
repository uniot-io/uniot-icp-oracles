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

  public type PublicationDto = {
    topic : Text;
    message : Blob;
    messageType : Text;
    signed : Bool;
    timestamp : Int;
    oracleId : Nat
  };

  public type OracleDto = {
    id : Nat;
    registrar : Principal;
    owner : Principal;
    name : Text;
    template : Text;
    subscriptions : [(Text, Text)];
    publications : [Text]
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

  public class Publication(_topic : Text, _message : Blob, _messageType : Text) {
    public let topic = _topic;
    public let message = _message;
    public let messageType = _messageType;
    public var timestamp : Int = 0;
    public var oracleId : Nat = 0;
    public var signed : Bool = false;

    public func getDto() : PublicationDto { { topic; message; messageType; signed; timestamp; oracleId } }
  };

  public class Oracle(_id : Nat, _registrar : Principal, _owner : Principal, _name : Text, _template : Text) {
    public let id = _id;
    public let registrar = _registrar;
    public let owner = _owner;
    public let name = _name;
    public let template = _template;
    public let subscriptions = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
    public let publications = TrieSetUtils.Set<Text>(Text.equal, Text.hash);

    public func getDto() : OracleDto {
      let subscriptionsArray = Array.init<(Text, Text)>(subscriptions.size(), ("", ""));
      var i = 0;
      for ((key, value) in subscriptions.entries()) {
        subscriptionsArray[i] := (key, value);
        i += 1
      };
      {
        id;
        registrar;
        owner;
        name;
        template;
        subscriptions = Array.freeze<(Text, Text)>(subscriptionsArray);
        publications = publications.toArray()
      }
    };

    public func getSubscriptionsIter() : I.Iter<Text> {
      subscriptions.keys()
    };

    public func subscribe(subscription : Subscription, messageType : Text) {
      subscriptions.put(subscription.topic, messageType);
      subscription.refCount += 1
    };

    public func publish(publication : Publication) {
      publications.put(publication.topic)
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
