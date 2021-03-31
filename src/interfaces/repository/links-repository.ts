export interface LinksRepository
{
	addLink(username: string, link: string);
	
	/**
	 * 
	 * @param username- the key in the map to whom the link is attached
	 * @return true if link was found (and removed). false otherwise.
	 */
	removeLink(username: string): boolean;

	//this is for the automated-tests only:
	getLink(username: string): string;
}
