"use strict";

/* global getRequest, postRequest */

const chai = require('chai');
const assert = chai.assert;
const should = chai.should();

describe('Describe GQL Page', async function() {
	let pageId, pageSlug;

	it(
		'Should create new page',
		async function() {
			// Let's login first
			await postRequest(
				`mutation WRAPPER($email: String $pwd: String) {
					login(email: $email pwd: $pwd) {Id}
				}`,
				{email: 'admin@local.local', pwd: 'admin'}
			);

			const res = await postRequest(
				`mutation WRAPPER($input: PageInput) {
					setPage(input: $input) {
						Id title slug created updated
					}
				}`,
				{
					input: {
						title: 'Sample Page',
						status: 'publish'
					}
				}
			);

			const page = res.body.data.setPage;

			assert.isObject(page);
			pageId = page.Id;
			pageSlug = page.slug;
		});

	it(
		'Should update a page',
		async function() {
			const res = await postRequest(
				`mutation WRAPPER($input: PageInput) {
					setPage(input: $input) {
						Id title status
					}
				}`,
				{
					input: {
						Id: pageId,
						status: 'pending'
					}
				}
			);

			const page = res.body.data.setPage;

			assert.isObject(page);
			page.status.should.be.equal('pending');
		});

	it(
		'Should get a page',
		async function() {
			const res = await getRequest(
				`query WRAPPER($Id: String $slug: String) {
					page1: getPage(Id: $Id) {Id slug}
					page2: getPage(slug: $slug) {Id slug}
				}`,
				{Id: pageId, slug: pageSlug}
			);

			const page1 = res.body.data.page1;
			const page2 = res.body.data.page2;

			assert.isObject(page1);
			assert.isObject(page2);
			page1.slug.should.be.equal(page2.slug);
		})

	it(
		'Should get pages',
		async function() {
			const res = await getRequest(`query WRAPPER(
					$status: String
				){
				getPages(status: $status) {
					items {Id}
					totalItems
					statusCount
					groupCount
					}
				}`);

			const pages = res.body.data.getPages;

			assert.isObject(pages);
			assert.isArray(pages.items);
			pages.totalItems.should.be.equal(1);
			assert.isObject(pages.statusCount);
			assert.isObject(pages.groupCount);
		});

	it(
		'Should delete a page',
		async function() {
			const res = await postRequest(
				`mutation WRAPPER($Id: String!){
					deletePage(Id: $Id)
				}`,
				{Id: pageId}
			);

			const done = res.body.data.deletePage;

			assert.isTrue(done);
		})
})