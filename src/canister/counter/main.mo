import Principal "mo:base/Principal";
import RBTree "mo:base/RBTree";
import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Array "mo:base/Array";

actor {
  class Oracle(_id : Nat, _owner : Principal) {
    public let id = _id;
    public let owner = _owner
  };

  class User(_principal : Principal) {
    public let principal = _principal;
    public let oracles = Array.init<Nat>(10, 0);
    public var oraclesCount = 0
  };

  // system func preupgrade() {
  //   let usersList = TrieMap.toList(users);
  //   System.save<[(Principal, User)]>(usersList)
  // };

  // system func postupgrade() {
  //   let usersList = System.load<[(Principal, User)]>();
  //   users := TrieMap.fromList<Principal, User>(Principal.equal, Principal.hash, usersList)
  // };

  var users : TrieMap.TrieMap<Principal, User> = TrieMap.TrieMap<Principal, User>(Principal.equal, Principal.hash);
  var oracles : RBTree.RBTree<Nat, Oracle> = RBTree.RBTree<Nat, Oracle>(Nat.compare);
  stable var oraclesCounter : Nat = 0;

  public query func getUser(principal : Principal) : async Text {
    return switch (users.get(principal)) {
      case null "User not found";
      case (?User) Principal.toText(User.principal)
    }
  };

  public query func getUserOracles(principal : Principal) : async [Nat] {
    return switch (users.get(principal)) {
      case null [];
      case (?User) Array.freeze<Nat>(User.oracles)
    }
  };

  public func increment() : async () {
    oraclesCounter += 1
  };

  public query func getValue() : async Nat {
    oraclesCounter
  };

  public shared (msg) func greet() : async Text {
    assert not Principal.isAnonymous(msg.caller);
    assert (
      switch (users.get(msg.caller)) {
        case null true;
        case _ false
      }
    );

    let user = User(msg.caller);
    user.oracles[user.oraclesCount] := oraclesCounter;
    user.oraclesCount += 1;
    users.put(msg.caller, user);

    oracles.put(oraclesCounter, Oracle(oraclesCounter, msg.caller));
    oraclesCounter += 1;

    return "Hello, " # Principal.toText(msg.caller) # "!"
  }
}
