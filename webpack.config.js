/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
	entry: "./src/index.tsx",
	mode: process.env.WEBPACK_MODE || "production",
	module: {
		rules: [{
			include: path.resolve(__dirname, "./src"),
			loader: "ts-loader",
			options: {
				transpileOnly: true,
			},
			test: /\.tsx?$/,
		}],
	},
	output: {
		filename: "index.js",
		path: path.resolve(__dirname, "./dist"),
	},
	performance: {
		hints: false,
	},
	plugins: [
		new ForkTsCheckerWebpackPlugin(),
	],
	resolve: {
		extensions: [
			".js",
			".ts",
			".tsx",
		],
	},
};
