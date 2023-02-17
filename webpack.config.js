import fs from "fs";

import copy from "copy-webpack-plugin";
import extract from "mini-css-extract-plugin";
import TerserJSPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import CompressionPlugin from "compression-webpack-plugin";
import ESLintPlugin from 'eslint-webpack-plugin';

import CockpitPoPlugin from "./pkg/lib/cockpit-po-plugin.js";
import CockpitRsyncPlugin from "./pkg/lib/cockpit-rsync-plugin.js";

/* A standard nodejs and webpack pattern */
const production = process.env.NODE_ENV === 'production';

// Obtain package name from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json'));

// Non-JS files which are copied verbatim to dist/
const copy_files = [
    "./src/index.html",
    "./src/manifest.json",
];
const plugins = [
    new copy({ patterns: copy_files }),
    new extract({ filename: "[name].css" }),
    new ESLintPlugin({
        extensions: ["js", "jsx"],
        failOnWarning: true,
    }),
    new CockpitPoPlugin(),
    new CockpitRsyncPlugin({ dest: packageJson.name }),
];

/* Only minimize when in production mode */
if (production) {
    plugins.unshift(new CompressionPlugin({
        test: /\.(js|html|css)$/,
        deleteOriginalAssets: true
    }));
}

const config = {
    mode: production ? 'production' : 'development',
    entry: {
        index: [
            "./src/index.js",
        ]
    },
    resolve: {
        modules: ['node_modules', 'pkg/lib'],
        alias: { 'font-awesome': 'font-awesome-sass/assets/stylesheets' },
    },
    resolveLoader: {
        modules: ['node_modules', 'pkg/lib'],
    },
    externals: { cockpit: "cockpit" },
    devtool: "source-map",

    optimization: {
        minimize: production,
        minimizer: [
            new TerserJSPlugin({
                extractComments: {
                    condition: true,
                    filename: `[file].LICENSE.txt?query=[query]&filebase=[base]`,
                    banner(licenseFile) {
                        return `License information can be found in ${licenseFile}`;
                    },
                },
            }),
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: ['lite']
                }
            })
        ],
    },

    module: {
        rules: [
            {
                exclude: /node_modules/,
                use: "babel-loader",
                test: /\.(js|jsx)$/
            },
            /* HACK: remove unwanted fonts from PatternFly's css */
            {
                test: /patternfly-4-cockpit.scss$/,
                use: [
                    extract.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                            url: false,
                        },
                    },
                    {
                        loader: 'string-replace-loader',
                        options: {
                            multiple: [
                                {
                                    search: /src:url\("patternfly-icons-fake-path\/pficon[^}]*/g,
                                    replace: 'src:url("../base1/fonts/patternfly.woff") format("woff");',
                                },
                                {
                                    search: /@font-face[^}]*patternfly-fonts-fake-path[^}]*}/g,
                                    replace: '',
                                },
                            ]
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: !production,
                            sassOptions: {
                                outputStyle: production ? 'compressed' : undefined,
                            },
                        },
                    },
                ]
            },
            {
                test: /\.s?css$/,
                exclude: /patternfly-4-cockpit.scss/,
                use: [
                    extract.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                            url: false
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: !production,
                            sassOptions: {
                                outputStyle: production ? 'compressed' : undefined,
                            },
                        },
                    },
                ]
            },
            {
                // See https://github.com/patternfly/patternfly-react/issues/3815 and
                // [Redefine grid breakpoints] section in pkg/lib/_global-variables.scss for more details
                // Components which are using the pf-global--breakpoint-* variables should import scss manually
                // instead off the automatically imported CSS stylesheets
                test: /\.css$/,
                include: stylesheet => {
                    return (
                        stylesheet.includes('@patternfly/react-styles/css/components/Table/')
                    );
                },
                use: ["null-loader"]
            }
        ]
    },
    plugins: plugins
};

export default config;
