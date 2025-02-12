import React from "react";
import { mockCompanyDetails } from "../constants/mock";
import Search from "./Search";

const Header = ({ name }) => {
    return <>
    <div className="x1:px-32">
        <h1 className="text-5xl">{name}</h1> 
        <Search/>
    </div>
    </>;
};

export default Header;