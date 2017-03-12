const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const path = require('path')

const paths = {

    sassVars: path.resolve(__dirname, './src/styles/config.jsx'),
    src: path.resolve(__dirname, 'src')
}

const nodeEnv = process.env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'

module.exports = {

    context: __dirname,

    entry: {
        main: './src/main.jsx'
    },

    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js'
    },

    resolve: {
        extensions: ['.js', '.jsx']
    },

    module: {

        rules: [
            {
                test: /\.jsx?$/,
                include: paths.src,
                use: [{
                    loader: 'babel-loader'
                }]
            }, {
                test: /.scss$/,
                include: paths.src,
                loader: ExtractTextPlugin.extract({
                    fallbackLoader: 'style-loader',
                    loader: [
                        {
                            loader: 'css-loader'
                        }, {
                            loader: 'postcss-loader'
                        }, {
                            loader: 'sass-loader'
                        }, {
                            loader: 'js-sass-loader'
                        }
                    ]
                })
            }
        ]
    },

    plugins: [

        new ExtractTextPlugin({
            filename: 'styles.css',
            allChunks: true,
        }),

        new HtmlWebpackPlugin({
            favicon: './src/assets/favicon.ico',
            title: 'Scaffold'
        }),

        new webpack.LoaderOptionsPlugin({
            options: {
                context: __dirname,
                postcss: [require('autoprefixer')],
                jsToSass: {
                    path: paths.sassVars
                }
            }
        })
    ],

    devtool: 'source-map',

    devServer: {
        contentBase: path.join(__dirname, 'build'),
        port: 7003
    }
}
