"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCoreStructure = exports.fetchRepoDetails = void 0;
const axios = require('axios');
const fs = require('fs');
const GITHUB_API_URL = 'https://api.github.com/repos/';
// Function to fetch the repository description and basic details
const fetchRepoDetails = (owner, repo) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios.get(`${GITHUB_API_URL}${owner}/${repo}`);
        return {
            description: response.data.description || 'No description provided.',
        };
    }
    catch (error) {
        console.error('Error fetching repository details:', error);
        throw error;
    }
});
exports.fetchRepoDetails = fetchRepoDetails;
// Function to fetch and simplify the repository structure recursively
const fetchCoreStructure = (owner_1, repo_1, ...args_1) => __awaiter(void 0, [owner_1, repo_1, ...args_1], void 0, function* (owner, repo, path = '') {
    try {
        const response = yield axios.get(`${GITHUB_API_URL}${owner}/${repo}/contents/${path}`);
        const structure = yield Promise.all(response.data.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            if (item.type === 'dir') {
                // For directories, recursively fetch nested contents
                return {
                    name: item.name,
                    type: 'directory',
                    contents: yield (0, exports.fetchCoreStructure)(owner, repo, item.path),
                };
            }
            else if (item.type === 'file') {
                // For files, return only the name and type
                return {
                    name: item.name,
                    type: 'file',
                };
            }
        })));
        return structure;
    }
    catch (error) {
        console.error('Error fetching file structure:', error);
        throw error;
    }
});
exports.fetchCoreStructure = fetchCoreStructure;
