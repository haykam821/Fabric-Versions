require("file-loader?name=[name].[ext]!html-minify-loader!./index.html");

import App from "./components/app";
import React from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
