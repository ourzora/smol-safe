// import { LedgerSigner } from "@anders-t/ethers-ledger";
// https://github.com/ethers-io/ext-signer/issues/4#issuecomment-918817511
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import Safe, {
  ContractNetworksConfig,
  EthersAdapter,
} from "@safe-global/protocol-kit";
import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";

const contractNetworks: ContractNetworksConfig = {
  [999]: {
    multiSendAddress: "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761",
    safeMasterCopyAddress: "0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552",
    safeProxyFactoryAddress: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2",
    multiSendCallOnlyAddress: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
    fallbackHandlerAddress: "0x1AC114C2099aFAf5261731655Dc6c306bFcd4Dbd",
    createCallAddress: "0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4",
    signMessageLibAddress: "0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2",
  },
  [7777777]: {
    multiSendAddress: "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761",
    safeMasterCopyAddress: "0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552",
    safeProxyFactoryAddress: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2",
    multiSendCallOnlyAddress: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
    fallbackHandlerAddress: "0x1AC114C2099aFAf5261731655Dc6c306bFcd4Dbd",
    createCallAddress: "0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4",
    signMessageLibAddress: "0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2",
  },
};

function log(text) {
  console.log(text);
  const log = document.querySelector("#log");
  if (!log) {
    return;
  }
  log.innerHTML += `<li>${text}</li>`;
}

async function getSafeSDK(network: string, safeAddress: string) {
  await (window as any).ethereum.enable();

  const provider = new StaticJsonRpcProvider(network);
  const ledgerSigner = new ethers.providers.Web3Provider(
    (window as any).ethereum
  ).getSigner();

  const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: provider });

  log(`ChainId: ${await ethAdapter.getChainId()}`);

  const safeSdk: Safe = await Safe.create({
    ethAdapter: ethAdapter,
    safeAddress,
    contractNetworks,
  });
  // const sdk = await safeSdk.connect({ethAdapter: ethAdapter1, safeAddress })
  log("has safe");

  const safeSdk2 = await safeSdk.connect({
    ethAdapter: new EthersAdapter({ ethers, signerOrProvider: ledgerSigner }),
    safeAddress,
    contractNetworks,
  });
  return { safeSdk, safeSdk2 };
}

async function runit(network, operation, safeAddress, transaction) {
  const { safeSdk, safeSdk2 } = await getSafeSDK(network, safeAddress);

  log("creating txn");
  const txn = await safeSdk.createTransaction({
    safeTransactionData: transaction,
  });

  if (operation === "execute") {
    const execute = await safeSdk2.executeTransaction(txn);
    log(`publishing approval tx ${execute.hash}`);
    await execute.transactionResponse?.wait();
    log("executed");
  }
  if (operation === "sign") {
    const txHash = await safeSdk2.getTransactionHash(txn);
    log(`has safe tx hash ${txHash}`);

    const approveTxResponse = await safeSdk2.approveTransactionHash(txHash);
    log(`publishing approval tx ${approveTxResponse.hash}`);
    await approveTxResponse.transactionResponse?.wait();
    log("published");
  }
}

function app() {
  const signForm = document.querySelector("#sign");
  if (signForm) {
    signForm.addEventListener("submit", (evt) => {
      evt.preventDefault();
      const data = {};
      const formData = new FormData(signForm as any);
      for (const pair of formData.entries()) {
        data[pair[0]] = pair[1];
      }
      try {
        const txn = {
          to: data["to"],
          value: parseEther(data["value"] || "0").toString(),
          data: data["data"] || "0x",
        };
        console.log({ txn });
        runit(data["network"], data["operation"], data["safeAddress"], txn);
      } catch (e) {
        alert(e.toString());
        return;
      }
    });
  }
  const executeForm = document.querySelector("#execute");
  if (executeForm) {
    executeForm.addEventListener("submit", (evt) => {
      evt.preventDefault();
      const data = {};
      const formData = new FormData(executeForm as any);
      for (const pair of formData.entries()) {
        data[pair[0]] = pair[1];
      }
      // do execute
      execute(data["safeAddress"], data["txnHash"]);
    });
  }
}

app();
