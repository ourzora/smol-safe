import { InferType, array, number, object, string } from "yup";
import { yupAddress } from "../utils/validators";

export const proposalSchema = object({
  nonce: number().nullable(),
  actions: array(
    object({
      to: yupAddress,
      value: string()
        .default("0")
        .matches(
          /^[0-9]+(\.[0-9]+)?$/,
          "Needs to be a ETH price (0, 1, or 0.23)",
        )
        .required(),
      data: string()
        .default("0x")
        .matches(
          /^0x(?:[0-9A-Za-z][0-9A-Za-z])*$/,
          "Data is required to match hex format",
        )
        .required(),
    }),
  ),
});

export interface Proposal extends InferType<typeof proposalSchema> {
  // using interface instead of type generally gives nicer editor feedback
}

export const DEFAULT_ACTION_ITEM = {
  to: "0x",
  value: "0",
  data: "0x",
};

export const DEFAULT_PROPOSAL = {
  nonce: null,
  actions: [DEFAULT_ACTION_ITEM],
};
