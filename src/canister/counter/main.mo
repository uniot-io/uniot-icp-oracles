import Principal "mo:base/Principal";

actor {
    stable var currentValue : Nat = 0;

    public func increment() : async () {
        currentValue += 1;
    };

    public query func getValue() : async Nat {
        currentValue;
    };

    public query (message) func greet() : async Text {
        return "Hello, " # Principal.toText(message.caller) # "! I am Uniot - the first DIY-friendly blockchain-based IoT platform.";
    };
};
