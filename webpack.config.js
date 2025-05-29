const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const webpack = require("webpack");
const WebpackObfuscator = require("webpack-obfuscator");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === "development";
  const version = env.VERSION || "v3";

  return {
    mode: isDevelopment ? "development" : "production",
    entry: {
      makeup: [
        "core-js/stable",
        "regenerator-runtime/runtime",
        "./src/index.js",
      ],
      "makeup.min": [
        "core-js/stable",
        "regenerator-runtime/runtime",
        "./src/index.js",
      ],
      "react-loader": "./src/loaders/react-loader.js",
    },
    output: {
      filename: (pathData) => {
        if (pathData.chunk.name === "makeup.min") {
          return "makeup.min.js";
        }
        if (pathData.chunk.name === "react-loader") {
          return "react-loader.min.js";
        }
        return "[name].js";
      },
      path: path.resolve(__dirname, "dist", version),
      library: {
        name: "Makeup",
        type: "var",
        export: "default",
      },
    },
    optimization: {
      minimize: !isDevelopment,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          test: /\.min\.js$/i,
          extractComments: false,
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              dead_code: true,
              drop_debugger: true,
              drop_console: !isDevelopment, // حذف کامل console.log در محیط production
              pure_funcs: !isDevelopment
                ? [
                    "console.log",
                    "console.info",
                    "console.debug",
                    "console.warn",
                  ]
                : [], // حذف توابع console در production
              conditionals: true,
              evaluate: true,
              booleans: true,
              loops: true,
              unused: true,
              hoist_funs: true,
              keep_fargs: false,
              hoist_vars: true,
              if_return: true,
              join_vars: true,
              side_effects: true,
              warnings: false,
            },
            mangle: true,
          },
        }),
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              "default",
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: !isDevelopment,
              },
            ],
          },
        }),
      ],
    },
    resolve: {
      fallback: {
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
      },
      alias: {
        "@styles": path.resolve(__dirname, "src/ui/styles"),
      },
      extensions: [".js", ".css"],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
                sourceMap: isDevelopment,
              },
            },
            {
              loader: "postcss-loader",
              options: {
                sourceMap: isDevelopment,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: isDevelopment ? "[name].css" : "makeup.min.css",
        chunkFilename: isDevelopment ? "[id].css" : "[id].[contenthash].css",
      }),
      new Dotenv({
        path: isDevelopment ? "./.env.development" : "./.env.production",
        systemvars: true,
      }),
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
      }),
      // اضافه کردن دستورات حذف console.log و موارد مشابه در سطح پلاگین‌ها نیز
      new webpack.DefinePlugin({
        // تعریف متغیرهای محیطی برای کنترل لاگ‌ها
        "process.env.NODE_ENV": JSON.stringify(
          isDevelopment ? "development" : "production"
        ),
        "process.env.SHOW_LOGS": JSON.stringify(isDevelopment),
      }),
      new WebpackObfuscator(
        {
          rotateStringArray: true,
          shuffleStringArray: true,
          stringArray: true,
          stringArrayEncoding: ["base64", "rc4"],
          stringArrayThreshold: 1,
          unicodeEscapeSequence: true,
          renameGlobals: true,
          identifierNamesGenerator: "mangled",
        },
        ["excluded_bundle_name.js"]
      ),
      ...(env.analyze
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: "server",
              analyzerPort: 8888,
              openAnalyzer: true,
            }),
          ]
        : []),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      compress: true,
      port: 3106,
      hot: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers":
          "X-Requested-With, content-type, Authorization",
      },
    },
    devtool: isDevelopment ? "source-map" : false,
  };
};
