import React from "react";
import Card from "./Card"; //This works idk why its big mad 
import { mockCompanyDetails } from "../constants/mock";
import Search from "./Search";
import Header from "./Header";

const Dashboard = () => {
    return (
        <div className = "h-screen grid grid-cols-1 md:grid-cols-2 x1:grid-cols-3 grid-rows-8 md:grid-rows-7 xl:grid-rows-5 auto-rows-fr gap-6 p-10 font-ubuntu">
            <div className = "col-span-1 md:col-span-2 x1:col-span-3 row-span-1 flex justify-start items-center">
                <Header name={mockCompanyDetails.name}/>
            </div>
            <div className = "md:col-span-2 row-span-4">
                <Card>Chart</Card>
            </div>
            <div>
                <Card>Overview</Card>
            </div>
            <div classNme = "row-span-2 x1:row-span-3">
                <Card>Details</Card>
            </div>
        </div>
    );
};

export default  Dashboard;