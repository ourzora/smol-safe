import Safe, {
  ContractNetworksConfig,
  EthersAdapter,
  SafeFactory,
} from "@safe-global/protocol-kit";
import Toastify from "toastify-js";
import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import '@zoralabs/zorb/dist/component.umd'
import "toastify-js/src/toastify.css";

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

const contractNetworks: ContractNetworksConfig = {
  [999]: defaultL2Addresses,
  [7777777]: defaultL2Addresses,
  [84531]: baseL2Addresses,
  [8453]: baseL2Addresses,
};

function log(text) {
  console.log(text);
  Toastify({
    text: text,
  }).showToast();
  const log = document.querySelector("#log");
  if (!log) {
    return;
  }
  log.innerHTML += `<li style="font-size: 0.89em">${text}</li>`;
}

async function getSafeSDK(safeAddress: string) {
  await (window as any).ethereum.enable();

  const signer = new ethers.providers.Web3Provider(
    (window as any).ethereum
  ).getSigner();

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  log(`ChainId: ${await ethAdapter.getChainId()}`);

  const safeSdk: Safe = await Safe.create({
    ethAdapter: ethAdapter,
    safeAddress,
    contractNetworks,
  });

  const safeSdk2 = await safeSdk.connect({
    ethAdapter: new EthersAdapter({ ethers, signerOrProvider: signer }),
    safeAddress,
    contractNetworks,
  });
  return { safeSdk, safeSdk2, signer };
}

async function runit(operation, safeAddress, transaction) {
  try {
    const { safeSdk, safeSdk2 } = await getSafeSDK(safeAddress);

    log(`creating txn for ${safeAddress.toString()}`);
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
      log("transaction has been confirmed");
    }
  } catch (err) {
    log(err.toString());
  }
}

async function create(threshold: string, signers: string[]) {
  const signer = new ethers.providers.Web3Provider(
    (window as any).ethereum
  ).getSigner();
  const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer });
  const adapter = await SafeFactory.create({ ethAdapter, contractNetworks });
  const sdk = await adapter.deploySafe({
    safeAccountConfig: {
      owners: signers,
      threshold: parseInt(threshold, 10),
    },
  });
  log(`deployed new safe: ${await sdk.getAddress()}`);
}

async function getSafeData(safeAddress: string) {
  try {
    const { safeSdk, signer } = await getSafeSDK(safeAddress);
    const owners = await safeSdk.getOwners();
    const threshold = await safeSdk.getThreshold();
    const chainId = await signer.getChainId();

    return { owners, threshold, chainId };
  } catch (err) {
    log(err.toString());
    throw err;
  }
}

function formDataAsDict(form: HTMLFormElement) {
  const data = {};
  const formData = new FormData(form);
  for (const pair of formData.entries()) {
    data[pair[0]] = pair[1];
  }
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  (window as any).ethereum.on("chainChanged", (networkId) => {
    document.querySelector("#network-id")!.innerHTML = parseInt(
      networkId,
      16
    ).toString();
  });
  (window as any).ethereum.on("accountsChanged", (accounts) => {
    log(`Switched account to ${accounts[0]}`);
    document.querySelector<HTMLDivElement>("#user-account")!.innerHTML =
      accounts[0];
  });
  (window as any).ethereum.on("connect", async (connectInfo: any) => {
    const accounts = await (window as any).ethereum.send("eth_requestAccounts");
    const firstAccount = accounts.result[0];
    document.querySelector<HTMLDivElement>("#user-account")!.innerHTML =
      firstAccount;
    document.querySelector<HTMLDivElement>("#connect-section")!.style.display =
      "none";
    const network = parseInt(connectInfo.chainId, 16).toString();
    document.querySelector("#network-id")!.innerHTML = network;
    log(`Switched connected to ${network} with ${firstAccount}`);
  });
});

function app() {
  const signForm = document.querySelector("#sign");
  if (signForm) {
    document
      .querySelector("#connect")
      ?.addEventListener("click", async (evt) => {
        evt.preventDefault();
        (window as any).ethereum.send("eth_requestAccounts");
      });
    document
      .querySelector("#safe-info")
      ?.addEventListener("click", async (evt) => {
        evt.preventDefault();
        const data = formDataAsDict(signForm as HTMLFormElement);
        const safeData = await getSafeData(data["safeAddress"]);
        document.querySelector("#safe-result")!.innerHTML = JSON.stringify(
          safeData,
          null,
          2
        );
      });
    signForm.addEventListener("submit", (evt) => {
      evt.preventDefault();
      const data = formDataAsDict(signForm as HTMLFormElement);
      try {
        const txn = {
          to: data["to"],
          value: parseEther(data["value"] || "0").toString(),
          data: data["data"] || "0x",
        };
        console.log({ txn });
        runit(data["operation"], data["safeAddress"], txn);
      } catch (e) {
        log(e);
        alert(e.toString());
        return;
      }
    });
  }
  const executeForm = document.querySelector("#create");
  if (executeForm) {
    executeForm.addEventListener("submit", (evt) => {
      evt.preventDefault();
      const data = formDataAsDict(executeForm as HTMLFormElement);
      // do execute
      try {
        create(data["threshold"], data["signers"].split("\n"));
      } catch (e) {
        log(e.toString());
        console.error(e);
      }
    });
  }
}

app();
