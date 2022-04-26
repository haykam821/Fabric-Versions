import { Element, xml2json as xml } from "xml-js";

import AsyncSelect from "react-select/async";
import Highlight from "react-highlight.js";
import React from "react";
import styled from "styled-components";

interface AppState {
	version?: string;
	yarn: string;
	loader: string;
	api: string;
	apiMaven: string;
}

interface AppProps {
	className: string;
}

interface Version {
	version: string;
	stable: boolean;
}

class AppUnstyled extends React.Component<Record<string, unknown>, AppState> {
	constructor(props: Readonly<Record<string, unknown>>) {
		super(props);

		this.state = {
			api: "LOADING",
			apiMaven: "net.fabricmc:fabric:",
			loader: "LOADING",
			version: null,
			yarn: "LOADING",
		};

		this.getPropertiesContents = this.getPropertiesContents.bind(this);
		this.getDependenciesContents = this.getDependenciesContents.bind(this);

		this.changeVersion = this.changeVersion.bind(this);
	}

	getDependenciesContents(): string {
		return "dependencies {\n" + [
			`\tminecraft "com.mojang:minecraft:${this.state.version}"`,
			`\tmappings "net.fabricmc:yarn:${this.state.yarn}:v2"`,
			`\tmodImplementation "net.fabricmc:fabric-loader:${this.state.loader}"`,
			`\tmodImplementation "net.fabricmc.fabric-api:fabric-api:${this.state.api}"`,
		].join("\n") + "\n}";
	}

	getPropertiesContents(): string {
		return [
			"minecraft_version=" + this.state.version,
			"yarn_mappings=" + this.state.yarn,
			"loader_version=" + this.state.loader,
			"fabric_version=" + this.state.api,
		].join("\n");
	}

	findByName(elements: Element[], name: string): Element {
		return elements.find(child => {
			return child.name === name;
		});
	}

	async changeVersion({ value }: { value: string }): Promise<void> {
		// Set Minecraft version
		this.setState({
			version: value,
		});

		// Fetch other details
		const loaderResponse = await fetch("https://meta.fabricmc.net/v1/versions/loader/" + value);
		const [ loaderVersions ] = await loaderResponse.json();

		this.setState({
			loader: loaderVersions.loader.version,
			yarn: loaderVersions.mappings.version,
		});

		// Fetch Fabric API version
		let mavenURL = "https://maven.fabricmc.net/net/fabricmc/fabric-api/fabric-api/maven-metadata.xml";
		if (value.startsWith("1.14")) {
			mavenURL = "https://maven.fabricmc.net/net/fabricmc/fabric/maven-metadata.xml";
		}

		const apiResponse = await fetch(mavenURL);
		const apiText = await apiResponse.text();
		const apiXML = JSON.parse(xml(apiText));

		const metadataNode = this.findByName(apiXML.elements, "metadata");
		const versioningNode = this.findByName(metadataNode.elements, "versioning");
		const versionsNode = this.findByName(versioningNode.elements, "versions");
		const apiVersions = versionsNode.elements;

		this.setState({
			/* eslint-disable-next-line unicorn/prefer-at */
			api: apiVersions[apiVersions.length - 1].elements[0].text as string,
			apiMaven: value.startsWith("1.14") ? "net.fabricmc:fabric:" : "net.fabricmc.fabric-api:fabric-api:",
		});
	}

	componentDidMount(): void {
		this.changeVersion({
			value: "1.15",
		});
	}

	render(): JSX.Element {
		return <div className={(this.props as unknown as AppProps).className}>
			<h1>Fabric Versions</h1>
			<AsyncSelect defaultInputValue="1.15" onChange={this.changeVersion} cacheOptions defaultOptions loadOptions={async (query: string) => {
				const verResponse = await fetch("https://meta.fabricmc.net/v2/versions/game");
				const versions: Version[] = await verResponse.json();

				return versions.filter(({ version }) => {
					return version.includes(query);
				}).map(({ version, stable }) => ({
					label: version + (stable ? "" : " (unstable)"),
					value: version,
				}));
			}} />
			<div>
				<div>
					<p>
						Put the following in your <code>build.gradle</code> file:
					</p>
					<Highlight language="gradle">
						{this.getDependenciesContents()}
					</Highlight>
				</div>
				<div>
					<p>
						Put the following in your <code>gradle.properties</code> file:
					</p>
					<Highlight language="properties">
						{this.getPropertiesContents()}
					</Highlight>
				</div>
			</div>
		</div>;
	}
}

const App = styled(AppUnstyled)`
	background-color: #eeeeee;
	font-family: sans-serif;
	padding: 32px;

	h1 {
		margin: 0;
		padding: 8px;
	}

	p, h1 {
		color: black;
	}

	p > code {
		background-color: #fafafa;
		padding: 4px;
		border-radius: 4px;
	}

	pre > code {
		border-radius: 4px;
		padding: 12px;
	}

	@media (prefers-color-scheme: dark) {
		background-color: #161616;

		p, h1 {
			color: white;
		}
		
		p > code {
				background-color: #282c34;
			}
		}
	}
`;
export default App;
