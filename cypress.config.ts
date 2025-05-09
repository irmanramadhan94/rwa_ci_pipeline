// Mengimpor modul path untuk bekerja dengan path file dan direktori
import path from "path";

// Mengimpor lodash untuk manipulasi data
import _ from "lodash";

// Mengimpor axios untuk melakukan HTTP request
import axios from "axios";

// Mengimpor dotenv untuk memuat variabel lingkungan dari file .env
import dotenv from "dotenv";

// Mengimpor bluebird untuk manipulasi Promise yang lebih canggih
import Promise from "bluebird";

// Mengimpor task untuk integrasi code coverage dengan Cypress
import codeCoverageTask from "@cypress/code-coverage/task";

// Mengimpor fungsi defineConfig untuk mendefinisikan konfigurasi Cypress
import { defineConfig } from "cypress";

// Mengimpor fungsi mergeConfig dan loadEnv untuk konfigurasi Vite
import { mergeConfig, loadEnv } from "vite";

// Memuat variabel lingkungan dari file .env.local jika ada
dotenv.config({ path: ".env.local" });

// Memuat variabel lingkungan dari file .env
dotenv.config();

// Mendeklarasikan konfigurasi AWS default
let awsConfig = {
  default: undefined,
};

// Mencoba memuat file konfigurasi AWS jika ada, jika gagal akan tetap undefined
try {
  awsConfig = require(path.join(__dirname, "./aws-exports-es5.js"));
} catch (e) {}

// Mengekspor konfigurasi Cypress menggunakan defineConfig
module.exports = defineConfig({
  // ID proyek Cypress
  projectId: "7s5okt",

  // Konfigurasi retry untuk mode run
  retries: {
    runMode: 2,
  },

  // Variabel lingkungan yang digunakan dalam pengujian
  env: {
    apiUrl: "http://localhost:3001", // URL API
    mobileViewportWidthBreakpoint: 414, // Lebar viewport untuk perangkat mobile
    coverage: false, // Status coverage
    codeCoverage: {
      url: "http://localhost:3001/__coverage__", // URL untuk code coverage
      exclude: "cypress/**/*.*", // File yang dikecualikan dari code coverage
    },
    defaultPassword: process.env.SEED_DEFAULT_USER_PASSWORD, // Password default
    paginationPageSize: process.env.PAGINATION_PAGE_SIZE, // Ukuran halaman untuk pagination

    // Konfigurasi Auth0
    auth0_username: process.env.AUTH0_USERNAME,
    auth0_password: process.env.AUTH0_PASSWORD,
    auth0_domain: process.env.VITE_AUTH0_DOMAIN,

    // Konfigurasi Okta
    okta_username: process.env.OKTA_USERNAME,
    okta_password: process.env.OKTA_PASSWORD,
    okta_domain: process.env.VITE_OKTA_DOMAIN,
    okta_client_id: process.env.VITE_OKTA_CLIENTID,
    okta_programmatic_login: process.env.OKTA_PROGRAMMATIC_LOGIN || false,

    // Konfigurasi Amazon Cognito
    cognito_username: process.env.AWS_COGNITO_USERNAME,
    cognito_password: process.env.AWS_COGNITO_PASSWORD,
    cognito_domain: process.env.AWS_COGNITO_DOMAIN,
    cognito_programmatic_login: false,
    awsConfig: awsConfig.default, // Konfigurasi AWS

    // Konfigurasi Google
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    googleClientId: process.env.VITE_GOOGLE_CLIENTID,
    googleClientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET,
  },

  // Konfigurasi untuk pengujian komponen
  component: {
    devServer: {
      framework: "react", // Framework yang digunakan
      bundler: "vite", // Bundler yang digunakan
      viteConfig: () => {
        // Memuat konfigurasi Vite
        const viteConfig = require("./vite.config.ts");
        const conf = {
          define: {
            "process.env": loadEnv("development", process.cwd(), "VITE"), // Memuat variabel lingkungan untuk Vite
          },
          server: {
            port: 3002, // Port untuk dev server komponen
          },
        };
        // Menggabungkan konfigurasi Vite dengan konfigurasi tambahan
        const resolvedViteConfig = mergeConfig(viteConfig, conf);
        return resolvedViteConfig;
      },
    },
    specPattern: "src/**/*.cy.{js,jsx,ts,tsx}", // Pola file spesifikasi komponen
    supportFile: "cypress/support/component.ts", // File support untuk pengujian komponen
    setupNodeEvents(on, config) {
      // Menambahkan task untuk code coverage
      codeCoverageTask(on, config);
      return config;
    },
  },

  // Konfigurasi untuk pengujian end-to-end
  e2e: {
    baseUrl: "http://localhost:3000", // URL dasar untuk pengujian E2E
    specPattern: "cypress/tests/**/*.spec.{js,jsx,ts,tsx}", // Pola file spesifikasi E2E
    supportFile: "cypress/support/e2e.ts", // File support untuk pengujian E2E
    viewportHeight: 1000, // Tinggi viewport
    viewportWidth: 1280, // Lebar viewport
    experimentalRunAllSpecs: true, // Mengaktifkan fitur eksperimental untuk menjalankan semua spesifikasi
    experimentalStudio: true, // Mengaktifkan fitur eksperimental Studio
    setupNodeEvents(on, config) {
      // Endpoint untuk API data pengujian
      const testDataApiEndpoint = `${config.env.apiUrl}/testData`;

      // Fungsi untuk melakukan query ke database
      const queryDatabase = ({ entity, query }, callback) => {
        const fetchData = async (attrs) => {
          const { data } = await axios.get(`${testDataApiEndpoint}/${entity}`);
          return callback(data, attrs);
        };

        return Array.isArray(query) ? Promise.map(query, fetchData) : fetchData(query);
      };

      // Menambahkan task untuk pengujian
      on("task", {
        async "db:seed"() {
          // Seed database dengan data pengujian
          const { data } = await axios.post(`${testDataApiEndpoint}/seed`);
          return data;
        },

        // Mengambil data dari database menggunakan filter
        "filter:database"(queryPayload) {
          return queryDatabase(queryPayload, (data, attrs) => _.filter(data.results, attrs));
        },

        // Mengambil data dari database menggunakan find
        "find:database"(queryPayload) {
          return queryDatabase(queryPayload, (data, attrs) => _.find(data.results, attrs));
        },
      });

      // Menambahkan task untuk code coverage
      codeCoverageTask(on, config);
      return config;
    },
  },
});
