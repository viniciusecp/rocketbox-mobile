import axios from 'axios';

const api = axios.create({
  baseURL: 'https://rocketbox-b.herokuapp.com',
  // baseURL: 'https://10.17.5.19:3333',
});

export default api;
