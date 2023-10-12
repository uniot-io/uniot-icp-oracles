import TrieSet "mo:base/TrieSet";
import Nat "mo:base/Nat";

module TrieSetUtils {

  public class Set<T>(isEq : (T, T) -> Bool, hashOf : T -> Nat32) {
    private var set : TrieSet.Set<T> = TrieSet.empty<T>();

    public func put(elem : T) {
      let hash = hashOf(elem);
      set := TrieSet.put<T>(set, elem, hash, isEq)
    };

    public func delete(elem : T) {
      let hash = hashOf(elem);
      set := TrieSet.delete<T>(set, elem, hash, isEq)
    };

    public func contains(elem : T) : Bool {
      let hash = hashOf(elem);
      return TrieSet.mem<T>(set, elem, hash, isEq)
    };

    public func toArray() : [T] {
      return TrieSet.toArray<T>(set)
    };

    public func fromArray(arr : [T]) {
      set := TrieSet.fromArray<T>(arr, hashOf, isEq)
    }
  };

}
