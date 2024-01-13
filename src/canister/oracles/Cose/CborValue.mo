import Iter "mo:base/Iter";
import FloatX "mo:xtended-numbers/FloatX";
import BasicValue "mo:cbor/Value";

module {
  public type Value = {
    #uint : Nat64;
    #int : Int;
    #bytes : [Nat8];
    #text : Text;
    #array : [Value];
    #map : [(Value, Value)];
    #tagged : {
      tag : Nat64;
      value : Value
    };
    #simple : {
      #int : Nat8;
      #bool : Bool;
      #nil;
      #undefined;
      #float : FloatX.FloatX;
      #_break
    }
  };

  private type BasicValuePair = (BasicValue.Value, BasicValue.Value);
  private type ReadableValuePair = (Value, Value);

  public func toReadable(basicValue : BasicValue.Value) : Value {
    switch (basicValue) {
      case (#majorType0(n)) {
        #uint(n)
      };
      case (#majorType1(n)) {
        #int(n)
      };
      case (#majorType2(bytes)) {
        #bytes(bytes)
      };
      case (#majorType3(text)) {
        #text(text)
      };
      case (#majorType4(arr)) {
        #array(
          Iter.toArray(
            Iter.map(
              Iter.fromArray(arr),
              func(item : BasicValue.Value) : Value {
                return toReadable(item)
              }
            )
          )
        )
      };
      case (#majorType5(map)) {
        #map(
          Iter.toArray(
            Iter.map(
              Iter.fromArray(map),
              func(pair : BasicValuePair) : ReadableValuePair {
                return (toReadable(pair.0), toReadable(pair.1))
              }
            )
          )
        )
      };
      case (#majorType6 { tag; value }) {
        #tagged { tag = tag; value = toReadable(value) }
      };
      case (#majorType7(#integer(i))) {
        #simple(#int(i))
      };
      case (#majorType7(#bool(b))) {
        #simple(#bool(b))
      };
      case (#majorType7(#_null)) {
        #simple(#nil)
      };
      case (#majorType7(#_undefined)) {
        #simple(#undefined)
      };
      case (#majorType7(#float(f))) {
        #simple(#float(f))
      };
      case (#majorType7(#_break)) {
        #simple(#_break)
      }
    }
  };

  public func toBasic(readeableValue : Value) : BasicValue.Value {
    switch (readeableValue) {
      case (#uint(n)) {
        #majorType0(n)
      };
      case (#int(n)) {
        #majorType1(n)
      };
      case (#bytes(bytes)) {
        #majorType2(bytes)
      };
      case (#text(text)) {
        #majorType3(text)
      };
      case (#array(arr)) {
        #majorType4(
          Iter.toArray(
            Iter.map(
              Iter.fromArray(arr),
              func(item : Value) : BasicValue.Value {
                return toBasic(item)
              }
            )
          )
        )
      };
      case (#map(map)) {
        #majorType5(
          Iter.toArray(
            Iter.map(
              Iter.fromArray(map),
              func(pair : ReadableValuePair) : BasicValuePair {
                return (toBasic(pair.0), toBasic(pair.1))
              }
            )
          )
        )
      };
      case (#tagged { tag; value }) {
        #majorType6 { tag = tag; value = toBasic(value) }
      };
      case (#simple(#int(i))) {
        #majorType7(#integer(i))
      };
      case (#simple(#bool(b))) {
        #majorType7(#bool(b))
      };
      case (#simple(#nil)) {
        #majorType7(#_null)
      };
      case (#simple(#undefined)) {
        #majorType7(#_undefined)
      };
      case (#simple(#float(f))) {
        #majorType7(#float(f))
      };
      case (#simple(#_break)) {
        #majorType7(#_break)
      }
    }
  }
}
