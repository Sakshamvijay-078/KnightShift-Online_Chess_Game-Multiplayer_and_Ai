interface DecodedToken {
  username?: string;
  name?: string;
  [key: string]: any;
}

export const decodeToken = () => {
    const token = localStorage.getItem('token');
    if(token==null){
        return "null";
    }
  try {
    const base64Url = token.split(".")[1]; // Extract payload
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as DecodedToken; // Parse and return as DecodedToken type
  } catch (error) {
    console.log("Invalid token", error);
    return null;
  }
};
