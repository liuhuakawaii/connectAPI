module.exports = {
  presets: [
    '@babel/preset-react',
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current"
        }
      },
    ]
  ],
  plugins: ["transform-es2015-modules-commonjs"]
};

