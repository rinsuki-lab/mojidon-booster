import HtmlWebpackPlugin = require("html-webpack-plugin")
import path = require("path")
import webpack = require("webpack")
// tslint:disable-next-line:no-var-requires
const VueLoaderPlugin = require("vue-loader/lib/plugin")

module.exports = {
    entry: "./src/index.ts",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].[hash].js",
    },
    module: {
        rules: [
            { test: /\.vue$/, loader: "vue-loader" },
            { test: /\.ts$/, loader: "ts-loader", options: {
                appendTsSuffixTo: [/\.vue$/],
            } },
            { test: /\.css$/, loader: "vue-style-loader!css-loader" },
        ],
    },
    plugins: [
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            title: "Mojidon Booster",
            meta: {
                description: "moji.m.toのアカウントのブーストを支援するやつ",
            },
        }),
    ],
    resolve: {
        extensions: [".ts", ".js", ".vue"],
    },
    devtool: "source-map",
} as webpack.Configuration
