const React = require("react");
const styled = require("styled-components").default;

const xml = require("xml-js").xml2json;

const AsyncSelect = require("react-select/async").default;
const Highlight = require("react-highlight.js").default;

class AppUnstyled extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			version: null,
			yarn: "LOADING",
			loader: "LOADING",
			api: "LOADING",
			apiMaven: "net.fabricmc:fabric:",
		};
		
		this.getPropertiesContents = this.getPropertiesContents.bind(this);
		this.getDependenciesContents = this.getDependenciesContents.bind(this);

		this.changeVersion = this.changeVersion.bind(this);
	}

	getDependenciesContents() {
		return "dependencies {\n" + [
			`\tminecraft "com.mojang:minecraft:${this.state.version}"`,
			`\tmappings "net.fabricmc:yarn:${this.state.yarn}:v2"`,
			`\tmodImplementation "net.fabricmc:fabric-loader:${this.state.loader}"`,
			`\tmodImplementation "net.fabricmc.fabric-api:fabric-api:${this.state.api}"`,
		].join("\n") + "\n}";
	}

	getPropertiesContents() {
		return [
			"minecraft_version=" + this.state.version,
			"yarn_mappings=" + this.state.yarn,
			"loader_version=" + this.state.loader,
			"fabric_version=" + this.state.api,
		].join("\n");
	}

	async changeVersion({ value }) {
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

		const apiVersions = apiXML.elements[0].elements[2].elements[1].elements;
		window.e = apiXML.elements[0].elements[2].elements[1].elements;
		this.setState({
			api: apiVersions[apiVersions.length - 1].elements[0].text,
			apiMaven: value.startsWith("1.14") ? "net.fabricmc:fabric:" : "net.fabricmc.fabric-api:fabric-api:",
		});
	}

	componentDidMount() {
		this.changeVersion({
			value: "1.14.4",
		});
	}

	render() {
		return <div className={this.props.className}>
			<h1>Fabric Versions</h1>
			<AsyncSelect defaultInputValue="1.14.4" onChange={this.changeVersion} cacheOptions defaultOptions loadOptions={async () => {
				const verResponse = await fetch("https://meta.fabricmc.net/v2/versions/game");
				const versions = await verResponse.json();

				return versions.map(({ version, stable }) => ({
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
module.exports = App;