import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Char "mo:base/Char";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Option "mo:base/Option";

/**
 * This module provides functions for encoding and decoding arrays of
 * unsigned 8-bit integers in hexadecimal format.
 *
 * Thanks to skilesare for the original implementation.
 * https://forum.dfinity.org/t/converting-blobs-from-candid-response-to-hex/13310
 */
module {
  private type Result<Ok, Err> = Result.Result<Ok, Err>;
  private let base : Nat8 = 0x10;
  private let symbols = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f'
  ];

  /**
   * Define a type to indicate that the decoder has failed.
   */
  public type DecodeError = {
    #msg : Text
  };

  /**
   * Encode an array of unsigned 8-bit integers in hexadecimal format.
   */
  public func encode(array : [Nat8]) : Text {
    Array.foldLeft<Nat8, Text>(
      array,
      "",
      func(accum, w8) {
        accum # encodeW8(w8)
      }
    )
  };

  /**
   * Encode an unsigned 8-bit integer in hexadecimal format.
   */
  private func encodeW8(w8 : Nat8) : Text {
    let c1 = symbols[Nat8.toNat(w8 / base)];
    let c2 = symbols[Nat8.toNat(w8 % base)];
    Char.toText(c1) # Char.toText(c2)
  };

  /**
   * Decode an array of unsigned 8-bit integers in hexadecimal format.
   */
  public func decode(text : Text) : Result<[Nat8], DecodeError> {
    let hex = Text.toLowercase(text);
    let next = hex.chars().next;
    func parse() : Result<Nat8, DecodeError> {
      Option.get<Result<Nat8, DecodeError>>(
        do ? {
          let c1 = next()!;
          let c2 = next()!;
          Result.chain<Nat8, Nat8, DecodeError>(
            decodeW4(c1),
            func(x1) {
              Result.chain<Nat8, Nat8, DecodeError>(
                decodeW4(c2),
                func(x2) {
                  #ok(x1 * base + x2)
                }
              )
            }
          )
        },
        #err(#msg "Not enough input!")
      )
    };
    var i = 0;
    let n = hex.size() / 2 + hex.size() % 2;
    let array = Array.init<Nat8>(n, 0);
    while (i != n) {
      switch (parse()) {
        case (#ok w8) {
          array[i] := w8;
          i += 1
        };
        case (#err err) {
          return #err err
        }
      }
    };
    #ok(Array.freeze<Nat8>(array))
  };

  /**
   * Decode an unsigned 4-bit integer in hexadecimal format.
   */
  private func decodeW4(char : Char) : Result<Nat8, DecodeError> {
    for (i in Iter.range(0, 15)) {
      if (symbols[i] == char) {
        return #ok(Nat8.fromNat(i))
      }
    };
    let str = "Unexpected character: " # Char.toText(char);
    #err(#msg str)
  }
}