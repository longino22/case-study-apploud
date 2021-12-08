<template>
    <form @submit.prevent>
        <label>Enter group id: </label>
        <input placeholder="example" v-model="submittedID" />
        <button name="Show users" @click="clearPreviousEntry(), runRequests()">
            Show users
        </button>
    </form>
    <ul>
        <li v-for="(info, index) in userInformation" v-bind:key="info.id">
            <b>{{ info.name }}</b> <i>(@{{ info.username }})</i>
            <div>
                <u>Groups</u>:
                <span v-if="groupInformation[index]"
                    >[{{ groupInformation[index].full_path }}
                </span>
                <span v-if="userInformation[index]">
                    ({{ getAccess(userInformation[index].access_level) }})]
                </span>
            </div>
            <div>
                <u>Projects</u>:
                <span
                    v-for="project in userProjects[index]"
                    v-bind:key="project.id"
                    >[{{ project.path }}</span
                >
                <span
                    v-for="detail in projectDetails[index]"
                    v-bind:key="detail.id"
                >
                    ({{ getAccess(detail.access_level) }})]
                </span>
            </div>
        </li>
    </ul>
    <span v-if="hasRequested">Total users: {{ userInformation.length }}</span>
</template>

<script>
import gitlabAPI from "../axios";
export default {
    name: "Users",
    data() {
        return {
            submittedID: null,
            groupInformation: [],
            userInformation: [],
            userProjects: [],
            projectDetails: [],
            firstName: null,
            lastName: null,
            hasRequested: false,
        };
    },
    methods: {
        /*
            1. GET all members (2) under SUBMITTED (top-level) group information
                & save to an array as userInformation
            2. GET all subgroups (3) under SUBMITTED (top-level) group
                & save to an array as groupInformation
            3. GET all members (2) under SUBGROUPS
                & push to an array groupInformation
            4. GET all user's projects (last step)


            When requesting groups with many users, subgroups I would use pagination
            to load only 10 projects, groups, users per page. This would speed up
            the request.
        */
        async runRequests() {
            try {
                await this.getUsers(this.submittedID);
                await this.getSubgroups();
                for (const group of this.groupInformation) {
                    await this.getUsers(group.id);
                }
                for (const user of this.userInformation) {
                    await this.getProjects(user.id);
                }
                for (let i = 0; i < this.userProjects.length; i++) {
                    if (this.userProjects[i].length == 0) {
                        this.projectDetails.push([]);
                    } else {
                        for (let j = 0; j < this.userProjects[i].length; j++) {
                            await this.getProjectsAccess(
                                this.userProjects[i][j].id
                            );
                        }
                    }
                }
                this.hasRequested = true;
            } catch (error) {
                console.log(error.message);
            }
        },
        async getSubgroups() {
            try {
                let subgroupsResponse = await gitlabAPI.get(
                    `/groups/${this.submittedID}/descendant_groups/`
                );
                console.log(subgroupsResponse.data);
                subgroupsResponse.data.forEach((group) => {
                    this.groupInformation.push(group);
                });
            } catch (error) {
                console.log(error.message);
            }
        },
        async getUsers(group_id) {
            try {
                let usersResponse = await gitlabAPI.get(
                    `/groups/${group_id}/members/`
                );
                console.log(usersResponse.data);
                if (usersResponse.data.length != 0) {
                    this.userInformation.push(...usersResponse.data);
                }
            } catch (error) {
                console.log(error.message);
            }
        },
        async getProjects(user_id) {
            try {
                let projectsResponse = await gitlabAPI.get(
                    `/users/${user_id}/projects`
                );
                console.log(projectsResponse.data);
                this.userProjects.push(projectsResponse.data);
            } catch (error) {
                console.log(error.message);
            }
        },
        async getProjectsAccess(project_id) {
            try {
                let accessResponse = await gitlabAPI.get(
                    `/projects/${project_id}/members`
                );
                console.log(accessResponse.data);
                this.projectDetails.push(accessResponse.data);
            } catch (error) {
                console.log(error.message);
            }
        },
        getAccess(access_code) {
            switch (true) {
                case access_code == 0:
                    return "No access";
                case access_code == 5:
                    return "Minimal access";
                case access_code == 10:
                    return "Reporter";
                case access_code == 30:
                    return "Developer";
                case access_code == 40:
                    return "Maintainer";
                case access_code == 50:
                    return "Owner";
            }
        },
        clearPreviousEntry() {
            this.groupInformation = [];
            this.userInformation = [];
            this.userProjects = [];
        },
    },
};
</script>

<style>
li {
    margin-bottom: 20px;
}
</style>
