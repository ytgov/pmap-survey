export const applicationName = "PMAP Survey Tool";
export const applicationIcon = "mdi-cash-register";
export const hasSidebar = true;
export const hasSidebarClosable = false;

export const sections = [
    {
        name: "Dashboard",
        url: "/dashboard",
        icon: "mdi-view-dashboard"
    },
    {
        name: "Vendors",
        url: "/vendors",
        icon: "mdi-domain"
    }
];
export const environment = process.env.NODE_ENV;
export const apiBaseUrl = process.env.NODE_ENV == "production" ? "" : "http://localhost:3000";
