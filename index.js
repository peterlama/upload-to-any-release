const path = require('path');
const fs = require('fs');
const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const releaseRepoOwner = github.context.repo.owner;
    const releaseRepo = core.getInput('repo');
    const releaseTag = core.getInput('release-tag');
    const artifactPath = core.getInput('path');

    const octokit = github.getOctokit(core.getInput('github-token'));
    const githubApi = octokit.rest;

    const { data: release } = await githubApi.repos.getReleaseByTag({
      owner: releaseRepoOwner,
      repo: releaseRepo,
      tag: releaseTag,
    });

    if (!release) {
      throw new Error(`Could not find release with tag ${releaseTag}`);
    }

    const fileName = path.basename(artifactPath);
    const existingAsset = release.assets.find(asset => asset.name == fileName);

    if (existingAsset) {
      throw new Error(`Asset ${fileName} already exists`);
    } else {
      const fileData = fs.readFileSync(artifactPath);
      const uploadResponse = await githubApi.repos.uploadReleaseAsset({
        owner: releaseRepoOwner,
        repo: releaseRepo,
        release_id: release.id,
        name: fileName,
        data: fileData
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
