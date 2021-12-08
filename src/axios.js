import axios from "axios";

const gitlabAPI = axios.create({
    baseURL: "https://gitlab.com/api/v4/",
});
gitlabAPI.interceptors.request.use(
    function (config) {
        // Do something before request is sent
        if (config.headers !== undefined) {
            config.headers["PRIVATE-TOKEN"] =
                process.env.VUE_APP_GITLAB_PRIVATE_TOKEN;
        }
        return config;
    },
    function (error) {
        // Do something with request error
        return Promise.reject(error);
    }
);

export default gitlabAPI;
