import { RouterProvider, createHashRouter } from "react-router-dom";
import { Container, Reshaped } from "reshaped";
import { App } from "./App";
// import { Error } from "./Error";
import { ViewSafe } from "./ViewSafe";
import { Root } from "./Root";
import { CreateSafe } from "./CreateSafe";
import { SafeInformation } from "./SafeInformation";

const router = createHashRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        path: "/",
        index: true,
        Component: App,
      },
      {
        path: "/create",
        Component: CreateSafe,
      },
      {
        path: "/safe/:networkId/:safeAddress",
        Component: ViewSafe,
        children: [
          {
            path: '/safe/:networkId/:safeAddress',
            index: true,
            Component: SafeInformation,
          },
        ]
      },
    ],
  },
]);

export const Wrapper = () => (
  <Reshaped theme="reshaped">
    <Container width="624px">
      <RouterProvider router={router} />
    </Container>
  </Reshaped>
);
