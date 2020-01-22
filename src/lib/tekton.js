/*
Copyright 2019 The Tekton Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
require('dotenv').config();

var { deleteRequest, get, patchAddSecret, patchUpdateSecrets, post, put } = require('./common.js');

const ALL_NAMESPACES = '*';

function getAPIRoot() {
	return process.env.IP + ":" + process.env.PORT;
}

const apiRoot = getAPIRoot();

function getQueryParams(filters) {
	if (filters.length) {
		return { labelSelector: filters };
	}
	return '';
}

function getAPI(type, { name = '', namespace } = {}, queryParams) {
	return [
		apiRoot,
		'/v1/namespaces/',
		encodeURIComponent(namespace),
		'/',
		type,
		'/',
		encodeURIComponent(name),
		queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ''
	].join('');
}

function getKubeAPI(type, { name = '', namespace, subResource } = {}, queryParams) {
	return [
		apiRoot,
		'/proxy/api/v1/',
		namespace && namespace !== ALL_NAMESPACES ? `namespaces/${encodeURIComponent(namespace)}/` : '',
		type,
		'/',
		encodeURIComponent(name),
		subResource ? `/${subResource}` : '',
		queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ''
	].join('');
}

function getResourcesAPI({ group, version, type, name = '', namespace }, queryParams) {
	return [
		apiRoot,
		`/proxy/apis/${group}/${version}/`,
		namespace && namespace !== ALL_NAMESPACES ? `namespaces/${encodeURIComponent(namespace)}/` : '',
		type,
		'/',
		encodeURIComponent(name),
		queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ''
	].join('');
}

function getTektonAPI(type, { name = '', namespace } = {}, queryParams) {
	return getResourcesAPI({ group: 'tekton.dev', version: 'v1alpha1', type, name, namespace }, queryParams);
}

function getExtensionBaseURL(name) {
	return `${apiRoot}/v1/extensions/${name}`;
}

function getExtensionBundleURL(name, bundlelocation) {
	return `${getExtensionBaseURL(name)}/${bundlelocation}`;
}

/* istanbul ignore next */
function getWebSocketURL() {
	return `${apiRoot.replace(/^http/, 'ws')}/v1/websockets/resources`;
}

function checkData(data) {
	if (data.items) {
		return data.items;
	}

	const error = new Error('Unable to retrieve data');
	error.data = data;
	throw error;
}

function getPipelines({ namespace } = {}) {
	const uri = getTektonAPI('pipelines', { namespace });
	return get(uri).then(checkData);
}

function getPipeline({ name, namespace }) {
	const uri = getTektonAPI('pipelines', { name, namespace });
	return get(uri);
}

function getPipelineRuns({ filters = [], namespace } = {}) {
	const uri = getTektonAPI('pipelineruns', { namespace }, getQueryParams(filters));
	return get(uri).then(checkData);
}

function getPipelineRun({ name, namespace }) {
	const uri = getTektonAPI('pipelineruns', { name, namespace });
	return get(uri);
}

function cancelPipelineRun({ name, namespace }) {
	return getPipelineRun({ name, namespace }).then((pipelineRun) => {
		pipelineRun.spec.status = 'PipelineRunCancelled'; // eslint-disable-line
		const uri = getTektonAPI('pipelineruns', { name, namespace });
		return put(uri, pipelineRun);
	});
}

function deletePipelineRun({ name, namespace }) {
	const uri = getTektonAPI('pipelineruns', { name, namespace });
	return deleteRequest(uri);
}

function deleteTaskRun({ name, namespace }) {
	const uri = getTektonAPI('taskruns', { name, namespace });
	return deleteRequest(uri);
}

function createPipelineResource({ namespace, resource } = {}) {
	const uri = getTektonAPI('pipelineresources', { namespace });
	return post(uri, resource);
}

function deletePipelineResource({ name, namespace } = {}) {
	const uri = getTektonAPI('pipelineresources', { name, namespace });
	return deleteRequest(uri, name);
}

function createPipelineRun({ namespace, pipelineName, resources, params, serviceAccount, timeout, labels }) {
	// Create PipelineRun payload
	// expect params and resources to be objects with keys 'name' and values 'value'
	const payload = {
		apiVersion: 'tekton.dev/v1alpha1',
		kind: 'PipelineRun',
		metadata: {
			name: `${pipelineName}-run-${Date.now()}`,
			labels: {
				...labels,
				'tekton.dev/pipeline': pipelineName,
				app: 'tekton-app'
			}
		},
		spec: {
			pipelineRef: {
				name: pipelineName
			},
			resources: Object.keys(resources).map((name) => ({
				name,
				resourceRef: { name: resources[name] }
			})),
			params: Object.keys(params).map((name) => ({
				name,
				value: params[name]
			}))
		}
	};
	if (serviceAccount) {
		payload.spec.serviceAccountName = serviceAccount;
	}
	if (timeout) {
		payload.spec.timeout = timeout;
	}
	const uri = getTektonAPI('pipelineruns', { namespace });
	return post(uri, payload);
}

function getClusterTasks() {
	const uri = getTektonAPI('clustertasks');
	return get(uri).then(checkData);
}

function getClusterTask({ name }) {
	const uri = getTektonAPI('clustertasks', { name });
	return get(uri);
}

function getTasks({ namespace } = {}) {
	const uri = getTektonAPI('tasks', { namespace });
	return get(uri).then(checkData);
}

function getTask({ name, namespace }) {
	const uri = getTektonAPI('tasks', { name, namespace });
	return get(uri);
}

function getTaskRuns({ filters = [], namespace } = {}) {
	const uri = getTektonAPI('taskruns', { namespace }, getQueryParams(filters));
	return get(uri).then(checkData);
}

function getTaskRun({ name, namespace }) {
	const uri = getTektonAPI('taskruns', { name, namespace });
	return get(uri);
}

function cancelTaskRun({ name, namespace }) {
	return getTaskRun({ name, namespace }).then((taskRun) => {
		taskRun.spec.status = 'TaskRunCancelled'; // eslint-disable-line
		const uri = getTektonAPI('taskruns', { name, namespace });
		return put(uri, taskRun);
	});
}

function getPipelineResources({ namespace } = {}) {
	const uri = getTektonAPI('pipelineresources', { namespace });
	return get(uri).then(checkData);
}

function getPipelineResource({ name, namespace }) {
	const uri = getTektonAPI('pipelineresources', { name, namespace });
	return get(uri);
}

function getPodLog({ container, name, namespace }) {
	let queryParams;
	if (container) {
		queryParams = { container };
	}
	const uri = `${getKubeAPI('pods', { name, namespace, subResource: 'log' }, queryParams)}`;
	return get(uri, { Accept: 'text/plain' });
}

function rerunPipelineRun(namespace, payload) {
	const uri = getAPI('rerun', { namespace });
	return post(uri, payload);
}

function getCredentials(namespace) {
	const queryParams = {
		fieldSelector: 'type=kubernetes.io/basic-auth'
	};
	const uri = getKubeAPI('secrets', { namespace }, queryParams);
	return get(uri);
}

function getAllCredentials(namespace) {
	const uri = getKubeAPI('secrets', namespace);
	return get(uri);
}

function getCredential(id, namespace) {
	const uri = getKubeAPI('secrets', { name: id, namespace });
	return get(uri);
}

function createCredential({ id, ...rest }, namespace) {
	const uri = getKubeAPI('secrets', { namespace });
	return post(uri, { id, ...rest });
}

function updateCredential({ id, ...rest }, namespace) {
	const uri = getKubeAPI('secrets', { name: id, namespace });
	return put(uri, { id, ...rest });
}

function deleteCredential(id, namespace) {
	const uri = getKubeAPI('secrets', { name: id, namespace });
	return deleteRequest(uri);
}

function getServiceAccount({ name, namespace }) {
	const uri = getKubeAPI('serviceaccounts', { name, namespace });
	return get(uri);
}

async function patchServiceAccount({ serviceAccountName, namespace, secretName }) {
	const uri = getKubeAPI('serviceaccounts', {
		name: serviceAccountName,
		namespace
	});
	const patch1 = await patchAddSecret(uri, secretName);
	return patch1;
}

// Use this for unpatching service accounts
async function updateServiceAccountSecrets(sa, namespace, secretsToKeep) {
	const uri = getKubeAPI('serviceaccounts', {
		name: sa.metadata.name,
		namespace
	});
	return patchUpdateSecrets(uri, secretsToKeep);
}

function getServiceAccounts({ namespace } = {}) {
	const uri = getKubeAPI('serviceaccounts', { namespace });
	return get(uri).then(checkData);
}

function getCustomResources(...args) {
	const uri = getResourcesAPI(...args);
	return get(uri).then(checkData);
}

function getCustomResource(...args) {
	const uri = getResourcesAPI(...args);
	return get(uri);
}

async function getExtensions() {
	const uri = `${apiRoot}/v1/extensions`;
	const resourceExtensionsUri = getResourcesAPI({
		group: 'dashboard.tekton.dev',
		version: 'v1alpha1',
		type: 'extensions'
	});
	let extensions = await get(uri);
	const resourceExtensions = await get(resourceExtensionsUri);
	extensions = (extensions || []).map(({ bundlelocation, displayname, name, url }) => ({
		displayName: displayname,
		name,
		source: getExtensionBundleURL(name, bundlelocation),
		url
	}));
	return extensions.concat(
		((resourceExtensions && resourceExtensions.items) || []).map(({ spec }) => {
			const { displayname: displayName, name } = spec;
			const [ apiGroup, apiVersion ] = spec.apiVersion.split('/');
			return {
				displayName,
				name,
				apiGroup,
				apiVersion,
				extensionType: 'kubernetes-resource'
			};
		})
	);
}

function getNamespaces() {
	const uri = getKubeAPI('namespaces');
	return get(uri).then(checkData);
}

function getInstallProperties() {
	const uri = `${apiRoot}/v1/properties`;
	return get(uri);
}

function shouldDisplayLogout() {
	const routesUri = getResourcesAPI({
		group: 'route.openshift.io',
		version: 'v1'
	});
	return get(routesUri, { Accept: 'text/plain' });
}

async function determineInstallNamespace() {
	const response = getInstallProperties()
		.then((installProps) => {
			return installProps.InstallNamespace;
		})
		.catch((error) => {
			throw error;
		});
	return response;
}

function getTriggerTemplates({ filters = [], namespace } = {}) {
	const uri = getTektonAPI('triggertemplates', { namespace }, getQueryParams(filters));
	return get(uri).then(checkData);
}

function getTriggerTemplate({ name, namespace }) {
	const uri = getTektonAPI('triggertemplates', { name, namespace });
	return get(uri);
}

function getTriggerBindings({ filters = [], namespace } = {}) {
	const uri = getTektonAPI('triggerbindings', { namespace }, getQueryParams(filters));
	return get(uri).then(checkData);
}

function getTriggerBinding({ name, namespace }) {
	const uri = getTektonAPI('triggerbindings', { name, namespace });
	return get(uri);
}

function getEventListeners({ filters = [], namespace } = {}) {
	const uri = getTektonAPI('eventlisteners', { namespace }, getQueryParams(filters));
	return get(uri).then(checkData);
}

function getEventListener({ name, namespace }) {
	const uri = getTektonAPI('eventlisteners', { name, namespace });
	return get(uri);
}

module.exports = {
	getAPIRoot,
	getQueryParams,
	getAPI,
	getKubeAPI,
	getResourcesAPI,
	getTektonAPI,
	getExtensionBaseURL,
	getExtensionBundleURL,
	getWebSocketURL,
	checkData,
	getPipelines,
	getPipeline,
	getPipelineRuns,
	getPipelineRun,
	cancelPipelineRun,
	deletePipelineRun,
	deleteTaskRun,
	createPipelineResource,
	deletePipelineResource,
	createPipelineRun,
	getClusterTasks,
	getClusterTask,
	getTasks,
	getTask,
	getTaskRuns,
	getTaskRun,
	cancelTaskRun,
	getPipelineResources,
	getPipelineResource,
	getPodLog,
	rerunPipelineRun,
	getCredentials,
	getAllCredentials,
	getCredential,
	createCredential,
	updateCredential,
	deleteCredential,
	getServiceAccount,
	patchServiceAccount,
	updateServiceAccountSecrets,
	getServiceAccounts,
	getCustomResources,
	getCustomResource,
	getExtensions,
	getNamespaces,
	getInstallProperties,
	shouldDisplayLogout,
	determineInstallNamespace,
	getTriggerTemplates,
	getTriggerTemplate,
	getTriggerBindings,
	getTriggerBinding,
	getEventListeners,
	getEventListener
};
