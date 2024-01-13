import CborValue "CborValue";

module CoseTypes {
  public type Message = {
    #sign1 : Sign1Message
  };

  public type Sign1Message = {
    var rawProtectedHeader : [Nat8];
    var protectedHeader : CborValue.Value;
    var unprotectedHeader : CborValue.Value;
    var payload : [Nat8];
    var signature : [Nat8]
  };

  public module HeaderLabel {
    public let Algorithm : Int = 1;
    public let Critical : Int = 2;
    public let ContentType : Int = 3;
    public let KeyIdentifier : Int = 4;
    public let IV : Int = 5;
    public let PartialIV : Int = 6;
    public let CounterSignature : Int = 7;
    public let CounterSignature0 : Int = 9;
    // ...
  };

  public module Algorithm {
    public let PS256 : Int = -37;
    public let PS384 : Int = -38;
    public let PS512 : Int = -39;
    public let ES256 : Int = -7;
    public let ES384 : Int = -35;
    public let ES512 : Int = -36;
    public let EdDSA : Int = -8;
    public let ES256K : Int = -47; // [RFC8812][RFC9053]
    // ...
  }
}
