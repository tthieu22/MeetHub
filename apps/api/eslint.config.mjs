// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        // tsconfigRootDir: './tsconfig.json',
      },
    },

    plugins: {
      prettier,
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',

      'no-undef': 'error',
      // 'no-unused-vars': 'error',
      'no-useless-catch': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'no-unsafe-optional-chaining': 'error',

      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
