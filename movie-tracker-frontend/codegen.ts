import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/graphql',
  documents: ['src/**/*.ts', 'src/**/*.tsx'],
  ignoreNoDocuments: true,
  generates: {
    './src/types/generated/': {
      preset: 'client',
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo'
      ],
      config: {
        withHooks: true,
        withHOC: false,
        withComponent: false,
        apolloReactHooksImportFrom: '@apollo/client',
        skipTypename: false,
        documentMode: 'documentNode',
        defaultScalarType: 'unknown',
        useTypeImports: true,
        scalars: {
          Timestamp: 'string',
          Upload: 'File'
        }
      }
    },
    './src/types/generated/schema.graphql': {
      plugins: ['schema-ast']
    }
  }
};

export default config;