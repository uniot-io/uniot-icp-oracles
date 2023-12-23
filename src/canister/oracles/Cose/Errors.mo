import CborErrors "mo:cbor/Errors";

module Errors {
  public type Error = {
    #msg : Text
  };

  public func extend(extendedMsg : Text, e : Error) : Error {
    #msg(
      switch (e) {
        case (#msg(messageText)) extendedMsg # ": " # messageText
      }
    )
  };

  public func extendDecodingError(extendedMsg : Text, e : CborErrors.DecodingError) : Error {
    #msg(
      switch (e) {
        case (#invalid(messageText)) extendedMsg # ": " # messageText;
        case (#unexpectedEndOfBytes) extendedMsg # ": " # "unexpected end of bytes";
        case (#unexpectedBreak) extendedMsg # ": " # "unexpected break"
      }
    )
  };

  public func extendEncodingError(extendedMsg : Text, e : CborErrors.EncodingError) : Error {
    #msg(
      switch (e) {
        case (#invalidValue(messageText)) extendedMsg # ": " # messageText
      }
    )
  }
}
