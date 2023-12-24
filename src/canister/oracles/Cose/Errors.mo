import CborErrors "mo:cbor/Errors";

module Errors {
  public type Error = {
    #msg : Text
  };

  public func wrap(wrapMsg : Text, e : Error) : Error {
    #msg(
      switch (e) {
        case (#msg(originMsg)) wrapMsg # ": " # originMsg
      }
    )
  };

  public func wrapDecodingError(wrapMsg : Text, e : CborErrors.DecodingError) : Error {
    #msg(
      switch (e) {
        case (#invalid(originMsg)) wrapMsg # ": " # originMsg;
        case (#unexpectedEndOfBytes) wrapMsg # ": " # "unexpected end of bytes";
        case (#unexpectedBreak) wrapMsg # ": " # "unexpected break"
      }
    )
  };

  public func wrapEncodingError(wrapMsg : Text, e : CborErrors.EncodingError) : Error {
    #msg(
      switch (e) {
        case (#invalidValue(originMsg)) wrapMsg # ": " # originMsg
      }
    )
  }
}
