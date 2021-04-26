require('k8w-extend-native');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const fs = require('fs');

// 自动从app.json中解析入口点
let entry = ['app']
    .concat(require('./src/app.json').pages)
    // .concat(glob.sync('src/components/*/*.ts').map(v => v.replace(/^src\//, '').replace(/\.ts$/, '')))
    .distinct()
    .reduce((prev, next) => {
        prev[next + '.js'] = './src/' + next + '.ts';
        if (fs.existsSync(path.resolve(__dirname, './src/' + next + '.less'))) {
            prev[next + '.wxss'] = './src/' + next + '.less';
        }
        return prev;
    }, {});

module.exports = {
    entry: entry,
    output: {
        filename: '[name]',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader' },
            {
                test: /\.less$/, use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].wxss',
                        context: path.resolve(__dirname, 'src')
                    },
                }, 'less-loader']
            },
            // { test: /\.(png|jpe?g|gif)$/, use: ['url-loader?limit=8192', 'img-loader'] }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: '**/*', context: 'src', globOptions: { ignore: ['**/*.ts'] } }
            ]
        })
    ],
    devtool: false
}