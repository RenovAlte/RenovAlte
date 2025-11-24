export * from "./projects";
export * from "./contractors";
export * from "./auth";
import axios from "axios";
axios.defaults.withCredentials = true;
const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    withCredentials: true,
});
