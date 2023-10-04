import Safe, {
  ContractNetworksConfig,
  EthersAdapter,
  SafeFactory,
} from "@safe-global/protocol-kit";
import Toastify from "toastify-js";
import { ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import "@zoralabs/zorb/dist/component.umd";
import "toastify-js/src/toastify.css";
import { contractNetworks } from "./chains";

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

async function getSigner() {
  await (window as any).ethereum.enable();

  return new ethers.providers.Web3Provider(
    (window as any).ethereum
  ).getSigner();
}

async function getSafeSDK(safeAddress: string) {
  const signer = await getSigner();

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
  try {
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
  } catch (err) {
    log(err.toString());
    throw err;
  }
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

async function getSafeTxnApprovals(safeAddress: string, txnData: any) {
  const { safeSdk, safeSdk2 } = await getSafeSDK(safeAddress);
  const txn = await safeSdk.createTransaction({
    safeTransactionData: txnData,
  });
  const hash = await safeSdk2.getTransactionHash(txn);
  return await safeSdk2.getOwnersWhoApprovedTx(hash);
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

function setInput(name: string, value: string | null) {
  if (value === null) {
    value = "";
  }

  const safeAddress = document.querySelector(
    `input[name=${name}]`
  ) as HTMLInputElement;
  safeAddress.value = value;
}

const getNetwork = async () =>
  (await (await getSigner()).getChainId()).toString();

function app() {
  const signForm = document.querySelector("#sign");

  async function getSafeInfo() {
    const data = formDataAsDict(signForm as HTMLFormElement);
    const safeData = await getSafeData(data["safeAddress"]);
    document.querySelector("#safe-result")!.innerHTML = JSON.stringify(
      safeData,
      null,
      2
    );
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("network")) {
      let network = params.get("network")!;
      if (network.startsWith("0x")) {
        network = parseInt(network, 16).toString();
      }

      const currentNetwork = await getNetwork();
      console.log({ currentNetwork, network });
      if (currentNetwork !== network) {
        console.log("changing network");
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${parseInt(network, 10).toString(16)}` }],
        });
      }
    }
    if (params.get("safe")) {
      console.log("has safe!");
      console.log(params.get("safe"));
      setInput("safeAddress", params.get("safe"));
      setInput("to", params.get("to"));
      setInput("value", params.get("value"));
      setInput("data", params.get("data"));
      getSafeInfo();
      (
        document.querySelector("summary.have-safe") as any
      ).parentElement.setAttribute("open", "1");
    }
  });

  if (signForm) {
    document
      .querySelector("#connect")
      ?.addEventListener("click", async (evt) => {
        evt.preventDefault();
        (window as any).ethereum.send("eth_requestAccounts");
      });
    document
      .querySelector("button.share-txn")
      ?.addEventListener("click", async (evt) => {
        evt.preventDefault();
        const params = new URLSearchParams();
        const data: any = formDataAsDict(signForm as HTMLFormElement);
        params.set("safe", data["safeAddress"]);
        params.set("to", data["to"]);
        params.set("data", data["data"]);
        params.set("value", data["value"]);
        params.set("network", await getNetwork());
        let location = window.location.href;
        if (location.indexOf("?") !== -1) {
          location = location.substring(0, location.indexOf("?"));
        }
        const url = `${location}?${params.toString()}`;
        (navigator as any).clipboard.writeText(url);
      });
    document
      .querySelector("#safe-info")
      ?.addEventListener("click", async (evt) => {
        evt.preventDefault();
        getSafeInfo();
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
    signForm.addEventListener("change", async () => {
      const data: any = formDataAsDict(signForm as HTMLFormElement);
      if (data.safeAddress && data.to && data.value && data.data) {
        const txn = {
          to: data["to"],
          value: parseEther(data["value"] || "0").toString(),
          data: data["data"] || "0x",
        };
        console.log({ txn, data });
        const approvals = await getSafeTxnApprovals(data["safeAddress"], txn);
        const approvalsHtml = document.querySelector("#txn-approvals")!;
        approvalsHtml.innerHTML = `${
          approvals.length
        } approvals for this txn [${approvals.join(", ")}]`;
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
