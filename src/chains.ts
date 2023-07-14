import { ContractNetworksConfig } from "@safe-global/protocol-kit";

const defaultL2Addresses = {
    multiSendAddress: "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761",
    safeMasterCopyAddress: "0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552",
    safeProxyFactoryAddress: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2",
    multiSendCallOnlyAddress: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
    fallbackHandlerAddress: "0x1AC114C2099aFAf5261731655Dc6c306bFcd4Dbd",
    createCallAddress: "0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4",
    signMessageLibAddress: "0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2",
  };
  
  const baseL2Addresses = {
    multiSendAddress: "0x998739BFdAAdde7C933B942a68053933098f9EDa",
    safeMasterCopyAddress: "0x69f4D1788e39c87893C980c06EdF4b7f686e2938",
    safeProxyFactoryAddress: "0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC",
    multiSendCallOnlyAddress: "0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B",
    fallbackHandlerAddress: "0x017062a1dE2FE6b99BE3d9d37841FeD19F573804",
    createCallAddress: "0xB19D6FFc2182150F8Eb585b79D4ABcd7C5640A9d",
    signMessageLibAddress: "0x98FFBBF51bb33A056B08ddf711f289936AafF717",
  };
  
  export const contractNetworks: ContractNetworksConfig = {
    [999]: defaultL2Addresses,
    [7777777]: defaultL2Addresses,
    [84531]: baseL2Addresses,
    [8453]: baseL2Addresses,
    [58008]: defaultL2Addresses,
  };
  